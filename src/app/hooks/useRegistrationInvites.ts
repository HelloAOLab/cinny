import { useCallback, useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';
import { AsyncStatus, useAsyncCallback } from './useAsyncCallback';
import {
  RegistrationBotConfig,
  RegistrationInvite,
  RegistrationInvitesResult,
  requestRegistrationInvites,
} from '../plugins/registration-bot';

/**
 * The registration links the bot has generated for the current user, loaded on mount.
 * `refresh` reloads them (e.g. after minting a new one) while keeping the last list
 * on screen until the new one arrives.
 */
export const useRegistrationInvites = (botConfig: RegistrationBotConfig) => {
  const mx = useMatrixClient();
  const [invites, setInvites] = useState<RegistrationInvite[]>();

  const [state, refresh] = useAsyncCallback<RegistrationInvitesResult, Error, []>(
    useCallback(() => requestRegistrationInvites(mx, botConfig), [mx, botConfig])
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (state.status === AsyncStatus.Success && state.data.success) {
      setInvites(state.data.invites);
    }
  }, [state]);

  const loading = state.status === AsyncStatus.Idle || state.status === AsyncStatus.Loading;

  let error: string | undefined;
  if (state.status === AsyncStatus.Error) error = state.error.message;
  else if (state.status === AsyncStatus.Success && !state.data.success) {
    error = state.data.error.message;
  }

  return { invites, loading, error, refresh };
};
