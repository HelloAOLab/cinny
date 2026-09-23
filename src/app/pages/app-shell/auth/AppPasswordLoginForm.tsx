import React, { FormEventHandler, useCallback } from 'react';
import { MatrixError } from 'matrix-js-sdk';
import { getMxIdLocalPart, getMxIdServer, isUserId } from '../../../utils/matrix';
import { EMAIL_REGEX } from '../../../utils/regex';
import { useAutoDiscoveryInfo } from '../../../hooks/useAutoDiscoveryInfo';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useClientConfig } from '../../../hooks/useClientConfig';
import {
  CustomLoginResponse,
  LoginError,
  factoryGetBaseUrl,
  login,
  useLoginComplete,
} from '../../auth/login/loginUtil';
import { AppPasswordInput } from './AppPasswordInput';
import { AppFieldError } from './AppFieldError';
import * as css from './AppAuthForm.css';

type AppPasswordLoginFormProps = {
  defaultUsername?: string;
  defaultEmail?: string;
};

export function AppPasswordLoginForm({ defaultUsername, defaultEmail }: AppPasswordLoginFormProps) {
  const clientConfig = useClientConfig();

  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;

  const [loginState, startLogin] = useAsyncCallback<
    CustomLoginResponse,
    MatrixError,
    Parameters<typeof login>
  >(useCallback(login, []));

  useLoginComplete(loginState.status === AsyncStatus.Success ? loginState.data : undefined);

  const handleUsernameLogin = (username: string, password: string) => {
    startLogin(baseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: username,
      },
      password,
      initial_device_display_name: '115.1 Mobile',
    });
  };

  const handleMxIdLogin = (mxId: string, password: string) => {
    const mxIdServer = getMxIdServer(mxId);
    const mxIdUsername = getMxIdLocalPart(mxId);
    if (!mxIdServer || !mxIdUsername) return;

    const getBaseUrl = factoryGetBaseUrl(clientConfig, mxIdServer);

    startLogin(getBaseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: mxIdUsername,
      },
      password,
      initial_device_display_name: '115.1 Mobile',
    });
  };

  const handleEmailLogin = (email: string, password: string) => {
    startLogin(baseUrl, {
      type: 'm.login.password',
      identifier: {
        type: 'm.id.thirdparty',
        medium: 'email',
        address: email,
      },
      password,
      initial_device_display_name: '115.1 Mobile',
    });
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const { usernameInput, passwordInput } = evt.target as HTMLFormElement & {
      usernameInput: HTMLInputElement;
      passwordInput: HTMLInputElement;
    };

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username) {
      usernameInput.focus();
      return;
    }
    if (!password) {
      passwordInput.focus();
      return;
    }

    if (isUserId(username)) {
      handleMxIdLogin(username, password);
      return;
    }
    if (EMAIL_REGEX.test(username)) {
      handleEmailLogin(username, password);
      return;
    }
    handleUsernameLogin(username, password);
  };

  const loading =
    loginState.status === AsyncStatus.Loading || loginState.status === AsyncStatus.Success;

  return (
    <form className={css.Form} onSubmit={handleSubmit}>
      <div className={css.FormGroup}>
        <span className={css.Label}>Username</span>
        <input
          name="usernameInput"
          className={css.Input}
          defaultValue={defaultUsername ?? defaultEmail}
          required
        />
        {loginState.status === AsyncStatus.Error && (
          <>
            {loginState.error.errcode === LoginError.ServerNotAllowed && (
              <AppFieldError message="Login with custom server not allowed by your client instance." />
            )}
            {loginState.error.errcode === LoginError.InvalidServer && (
              <AppFieldError message="Failed to find your Matrix ID server." />
            )}
          </>
        )}
      </div>
      <div className={css.FormGroup}>
        <span className={css.Label}>Password</span>
        <AppPasswordInput name="passwordInput" required />
        {loginState.status === AsyncStatus.Error && (
          <>
            {loginState.error.errcode === LoginError.Forbidden && (
              <AppFieldError message="Invalid username or password." />
            )}
            {loginState.error.errcode === LoginError.UserDeactivated && (
              <AppFieldError message="This account has been deactivated." />
            )}
            {loginState.error.errcode === LoginError.InvalidRequest && (
              <AppFieldError message="Failed to login. Part of your request data is invalid." />
            )}
            {loginState.error.errcode === LoginError.RateLimited && (
              <AppFieldError message="Failed to login. Your login request has been rate-limited by the server. Please try again later." />
            )}
            {loginState.error.errcode === LoginError.Unknown && (
              <AppFieldError message="Failed to login. Unknown reason." />
            )}
          </>
        )}
      </div>
      <button type="submit" className={css.SubmitButton} disabled={loading}>
        Log in
      </button>
      {loading && (
        <div className={css.LoadingOverlay}>
          <div className={css.Spinner} />
          <span className={css.LoadingText}>Signing in…</span>
        </div>
      )}
    </form>
  );
}
