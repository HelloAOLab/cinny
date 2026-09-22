import React, { FormEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AuthType,
  IAuthData,
  MatrixError,
  RegisterRequest,
  UIAFlow,
  createClient,
} from 'matrix-js-sdk';
import { useAutoDiscoveryInfo } from '../../../hooks/useAutoDiscoveryInfo';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useUIAFlow } from '../../../hooks/useUIAFlows';
import { ConfirmPasswordMatch } from '../../../components/ConfirmPasswordMatch';
import { RegisterError, RegisterResult, register } from '../../auth/register/registerUtil';
import { useAppRegisterComplete } from './useAppRegisterComplete';
import { AppPasswordInput } from './AppPasswordInput';
import { AppFieldError } from './AppFieldError';
import * as css from './AppAuthForm.css';

type Credentials = {
  username: string;
  password: string;
};

type AppPasswordRegisterFormProps = {
  authData: IAuthData;
  uiaFlow: UIAFlow;
  defaultUsername?: string;
};

export function AppPasswordRegisterForm({
  authData,
  uiaFlow,
  defaultUsername,
}: AppPasswordRegisterFormProps) {
  const serverDiscovery = useAutoDiscoveryInfo();
  const baseUrl = serverDiscovery['m.homeserver'].base_url;
  const mx = useMemo(() => createClient({ baseUrl }), [baseUrl]);
  const credsRef = useRef<Credentials>();

  const [registerState, handleRegister] = useAsyncCallback<
    RegisterResult,
    MatrixError,
    [RegisterRequest]
  >(useCallback(async (registerReqData) => register(mx, registerReqData), [mx]));
  const [ongoingAuthData, customRegisterResp] =
    registerState.status === AsyncStatus.Success ? registerState.data : [];
  const registerError =
    registerState.status === AsyncStatus.Error ? registerState.error : undefined;

  useAppRegisterComplete(customRegisterResp);

  const { getStageToComplete } = useUIAFlow(ongoingAuthData ?? authData, uiaFlow);

  // The chosen flow only ever requires the near-universal m.login.dummy
  // stage (see AppRegister's APP_SUPPORTED_REGISTER_STAGES) - auto-complete
  // it transparently the moment the server asks for it.
  useEffect(() => {
    if (!ongoingAuthData || customRegisterResp || !credsRef.current) return;
    const stage = getStageToComplete();
    if (!stage || stage.type !== AuthType.Dummy) return;

    handleRegister({
      username: credsRef.current.username,
      password: credsRef.current.password,
      auth: {
        type: AuthType.Dummy,
        session: stage.session,
      },
      initial_device_display_name: 'Cinny Mobile',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongoingAuthData]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const { usernameInput, passwordInput, confirmPasswordInput } = evt.target as HTMLFormElement & {
      usernameInput: HTMLInputElement;
      passwordInput: HTMLInputElement;
      confirmPasswordInput: HTMLInputElement;
    };

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (!username) {
      usernameInput.focus();
      return;
    }
    if (password !== confirmPassword) {
      return;
    }

    credsRef.current = { username, password };
    handleRegister({
      username,
      password,
      auth: {
        session: authData.session,
      },
      initial_device_display_name: 'Cinny Mobile',
    });
  };

  const loading = registerState.status === AsyncStatus.Loading;

  return (
    <form className={css.Form} onSubmit={handleSubmit}>
      <div className={css.FormGroup}>
        <span className={css.Label}>Username</span>
        <input name="usernameInput" className={css.Input} defaultValue={defaultUsername} required />
        {registerError?.errcode === RegisterError.UserTaken && (
          <AppFieldError message="This username is already taken." />
        )}
        {registerError?.errcode === RegisterError.UserInvalid && (
          <AppFieldError message="This username contains invalid characters." />
        )}
        {registerError?.errcode === RegisterError.UserExclusive && (
          <AppFieldError message="This username is reserved." />
        )}
      </div>
      <ConfirmPasswordMatch initialValue>
        {(match, doMatch, passRef, confPassRef) => (
          <>
            <div className={css.FormGroup}>
              <span className={css.Label}>Password</span>
              <AppPasswordInput ref={passRef} onChange={doMatch} name="passwordInput" required />
              {registerError?.errcode === RegisterError.PasswordWeak && (
                <AppFieldError
                  message={
                    registerError.data.error ?? 'Weak password. Please choose a stronger password.'
                  }
                />
              )}
              {registerError?.errcode === RegisterError.PasswordShort && (
                <AppFieldError
                  message={
                    registerError.data.error ?? 'Short password. Please choose a longer password.'
                  }
                />
              )}
            </div>
            <div className={css.FormGroup}>
              <span className={css.Label}>Confirm Password</span>
              <AppPasswordInput
                ref={confPassRef}
                onChange={doMatch}
                name="confirmPasswordInput"
                style={{ borderColor: match ? undefined : '#d64545' }}
                required
              />
            </div>
          </>
        )}
      </ConfirmPasswordMatch>
      {registerError?.errcode === RegisterError.RateLimited && (
        <AppFieldError message="Failed to register. Your request has been rate-limited by the server. Please try again later." />
      )}
      {registerError?.errcode === RegisterError.Forbidden && (
        <AppFieldError message="Failed to register. The homeserver does not permit registration." />
      )}
      {registerError?.errcode === RegisterError.InvalidRequest && (
        <AppFieldError message="Failed to register. Invalid request." />
      )}
      {registerError?.errcode === RegisterError.Unknown && (
        <AppFieldError
          message={registerError.data.error ?? 'Failed to register. Unknown reason.'}
        />
      )}
      <button type="submit" className={css.SubmitButton} disabled={loading}>
        Register
      </button>
      {loading && (
        <div className={css.LoadingOverlay}>
          <div className={css.Spinner} />
          <span className={css.LoadingText}>Creating your account…</span>
        </div>
      )}
    </form>
  );
}
