import React, { useCallback, useEffect } from 'react';
import {
  Outlet,
  generatePath,
  matchPath,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import {
  clientAllowedServer,
  clientDefaultServer,
  useClientConfig,
} from '../../../hooks/useClientConfig';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { APP_LOGIN_PATH, APP_REGISTER_PATH } from '../../paths';
import { AutoDiscoveryAction, autoDiscovery } from '../../../cs-api';
import { SpecVersionsLoader } from '../../../components/SpecVersionsLoader';
import { SpecVersionsProvider } from '../../../hooks/useSpecVersions';
import { AutoDiscoveryInfoProvider } from '../../../hooks/useAutoDiscoveryInfo';
import { AuthFlowsLoader } from '../../../components/AuthFlowsLoader';
import { AuthFlowsProvider } from '../../../hooks/useAuthFlows';
import { AuthServerProvider } from '../../../hooks/useAuthServer';
import { tryDecodeURIComponent } from '../../../utils/dom';
import { getAppPath } from '../../pathUtils';
import { getAfterLoginRedirectPath, setAfterLoginRedirectPath } from '../../afterLoginRedirectPath';
import { AppServerPicker } from './AppServerPicker';
import * as css from './AppAuthLayout.css';

const currentAuthPath = (pathname: string): string => {
  if (matchPath(APP_REGISTER_PATH, pathname)) {
    return APP_REGISTER_PATH;
  }
  return APP_LOGIN_PATH;
};

export function AppAuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { server: urlEncodedServer } = useParams();

  const clientConfig = useClientConfig();

  const defaultServer = clientDefaultServer(clientConfig);
  let server: string = urlEncodedServer ? tryDecodeURIComponent(urlEncodedServer) : defaultServer;

  if (!clientAllowedServer(clientConfig, server)) {
    server = defaultServer;
  }

  const [discoveryState, discoverServer] = useAsyncCallback(
    useCallback(async (serverName: string) => {
      const response = await autoDiscovery(fetch, serverName);
      return {
        serverName,
        response,
      };
    }, [])
  );

  useEffect(() => {
    if (server) discoverServer(server);
  }, [discoverServer, server]);

  // if server mismatches with path server, update path
  useEffect(() => {
    if (!urlEncodedServer || tryDecodeURIComponent(urlEncodedServer) !== server) {
      navigate(
        generatePath(currentAuthPath(location.pathname), {
          server: encodeURIComponent(server),
        }),
        { replace: true }
      );
    }
  }, [urlEncodedServer, navigate, location, server]);

  // A visitor who lands here without first being bounced from a gated /app
  // URL (i.e. no redirect path was ever stored) would otherwise fall back
  // to the desktop home path after login/register - default them into
  // /app instead.
  useEffect(() => {
    if (!getAfterLoginRedirectPath()) {
      setAfterLoginRedirectPath(getAppPath());
    }
  }, []);

  const selectServer = useCallback(
    (newServer: string) => {
      if (newServer === server) {
        if (discoveryState.status === AsyncStatus.Loading) return;
        discoverServer(server);
        return;
      }
      navigate(
        generatePath(currentAuthPath(location.pathname), { server: encodeURIComponent(newServer) })
      );
    },
    [navigate, location, discoveryState, server, discoverServer]
  );

  const [autoDiscoveryError, autoDiscoveryInfo] =
    discoveryState.status === AsyncStatus.Success ? discoveryState.data.response : [];

  return (
    <div className={css.Page}>
      <div className={css.Card}>
        <div className={css.Header}>
          <span className={css.Title}>Cinny</span>
        </div>
        <div className={css.Content}>
          <div className={css.FormGroup}>
            <span className={css.Label}>Homeserver</span>
            <AppServerPicker
              server={server}
              serverList={clientConfig.homeserverList ?? []}
              allowCustomServer={clientConfig.allowCustomHomeservers}
              onServerChange={selectServer}
            />
          </div>
          {discoveryState.status === AsyncStatus.Loading && (
            <span className={css.StatusText}>Looking for homeserver...</span>
          )}
          {discoveryState.status === AsyncStatus.Error && (
            <span className={css.ErrorText}>Failed to find homeserver.</span>
          )}
          {autoDiscoveryError?.action === AutoDiscoveryAction.FAIL_PROMPT && (
            <span className={css.ErrorText}>
              {`Failed to connect. Homeserver configuration found with ${autoDiscoveryError.host} appears unusable.`}
            </span>
          )}
          {autoDiscoveryError?.action === AutoDiscoveryAction.FAIL_ERROR && (
            <span className={css.ErrorText}>
              Failed to connect. Homeserver configuration base_url appears invalid.
            </span>
          )}
          {discoveryState.status === AsyncStatus.Success && autoDiscoveryInfo && (
            <AuthServerProvider value={discoveryState.data.serverName}>
              <AutoDiscoveryInfoProvider value={autoDiscoveryInfo}>
                <SpecVersionsLoader
                  baseUrl={autoDiscoveryInfo['m.homeserver'].base_url}
                  fallback={() => (
                    <span className={css.StatusText}>
                      {`Connecting to ${autoDiscoveryInfo['m.homeserver'].base_url}`}
                    </span>
                  )}
                  error={() => (
                    <span className={css.ErrorText}>
                      Failed to connect. Either homeserver is unavailable at this moment or does not
                      exist.
                    </span>
                  )}
                >
                  {(specVersions) => (
                    <SpecVersionsProvider value={specVersions}>
                      <AuthFlowsLoader
                        fallback={() => (
                          <span className={css.StatusText}>Loading authentication flow...</span>
                        )}
                        error={() => (
                          <span className={css.ErrorText}>
                            Failed to get authentication flow information.
                          </span>
                        )}
                      >
                        {(authFlows) => (
                          <AuthFlowsProvider value={authFlows}>
                            <Outlet />
                          </AuthFlowsProvider>
                        )}
                      </AuthFlowsLoader>
                    </SpecVersionsProvider>
                  )}
                </SpecVersionsLoader>
              </AutoDiscoveryInfoProvider>
            </AuthServerProvider>
          )}
        </div>
      </div>
    </div>
  );
}
