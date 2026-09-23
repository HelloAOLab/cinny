import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthServer } from '../../../hooks/useAuthServer';
import { useAuthFlows } from '../../../hooks/useAuthFlows';
import { useParsedLoginFlows } from '../../../hooks/useParsedLoginFlows';
import { getAppRegisterPath } from '../../pathUtils';
import { AppPasswordLoginForm } from './AppPasswordLoginForm';
import * as css from './AppAuthForm.css';

export function AppLogin() {
  const server = useAuthServer();
  const { loginFlows } = useAuthFlows();
  const [searchParams] = useSearchParams();
  const parsedFlows = useParsedLoginFlows(loginFlows.flows);

  const defaultUsername = searchParams.get('username') ?? undefined;
  const defaultEmail = searchParams.get('email') ?? undefined;

  return (
    <>
      <h1 className={css.Heading}>Sign in</h1>
      {parsedFlows.password ? (
        <AppPasswordLoginForm defaultUsername={defaultUsername} defaultEmail={defaultEmail} />
      ) : (
        <span className={css.ErrorText}>
          This app doesn&apos;t support this homeserver&apos;s sign-in method yet.
        </span>
      )}
      <span className={css.HelperText}>
        Don&apos;t have an account?{' '}
        <Link className={css.HelperLink} to={getAppRegisterPath(server)}>
          Register
        </Link>
      </span>
    </>
  );
}
