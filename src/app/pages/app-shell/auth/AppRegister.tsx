import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthType } from 'matrix-js-sdk';
import { useAuthServer } from '../../../hooks/useAuthServer';
import { RegisterFlowStatus, useAuthFlows } from '../../../hooks/useAuthFlows';
import { SupportedUIAFlowsLoader } from '../../../components/SupportedUIAFlowsLoader';
import { getAppLoginPath } from '../../pathUtils';
import { AppPasswordRegisterForm } from './AppPasswordRegisterForm';
import * as css from './AppAuthForm.css';

// This mobile flow only auto-completes the near-universal m.login.dummy
// UIA stage - homeservers that require Terms/Email/RegistrationToken/
// CAPTCHA for registration aren't supported here yet (desktop /register/
// remains available for those).
const APP_SUPPORTED_REGISTER_STAGES = [AuthType.Dummy];

export function AppRegister() {
  const server = useAuthServer();
  const { registerFlows } = useAuthFlows();
  const [searchParams] = useSearchParams();
  const defaultUsername = searchParams.get('username') ?? undefined;

  return (
    <>
      <h1 className={css.Heading}>Create account</h1>
      {registerFlows.status === RegisterFlowStatus.RegistrationDisabled && (
        <span className={css.ErrorText}>Registration has been disabled on this homeserver.</span>
      )}
      {registerFlows.status === RegisterFlowStatus.RateLimited && (
        <span className={css.ErrorText}>You have been rate-limited. Please try again later.</span>
      )}
      {registerFlows.status === RegisterFlowStatus.InvalidRequest && (
        <span className={css.ErrorText}>
          Failed to get registration options from this homeserver.
        </span>
      )}
      {registerFlows.status === RegisterFlowStatus.FlowRequired && (
        <SupportedUIAFlowsLoader
          flows={registerFlows.data.flows ?? []}
          supportedStages={APP_SUPPORTED_REGISTER_STAGES}
        >
          {(supportedFlows) =>
            supportedFlows.length === 0 ? (
              <span className={css.ErrorText}>
                This app doesn&apos;t support this homeserver&apos;s registration requirements yet.
              </span>
            ) : (
              <AppPasswordRegisterForm
                authData={registerFlows.data}
                uiaFlow={supportedFlows[0]}
                defaultUsername={defaultUsername}
              />
            )
          }
        </SupportedUIAFlowsLoader>
      )}
      <span className={css.HelperText}>
        Already have an account?{' '}
        <Link className={css.HelperLink} to={getAppLoginPath(server)}>
          Login
        </Link>
      </span>
    </>
  );
}
