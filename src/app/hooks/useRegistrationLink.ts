import { useCallback, useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';
import { AsyncStatus, useAsyncCallback } from './useAsyncCallback';
import {
  RegistrationClientInfo,
  RegistrationBotConfig,
  RegistrationClientsResult,
  RegistrationLinkResult,
  requestRegistrationClients,
  requestRegistrationLink,
} from '../plugins/registration-bot';
import { copyToClipboard } from '../utils/dom';

/**
 * State and actions for asking the registration bot for a single-use registration
 * link: loads the bot's client list, tracks the picked client, requests the link and
 * copies it. Shared by every invite UI so they only differ in presentation.
 */
export const useRegistrationLink = (botConfig: RegistrationBotConfig) => {
  const mx = useMatrixClient();
  const [copied, setCopied] = useState(false);
  const [clientId, setClientId] = useState(botConfig.clientId);

  const [clientsState, getClients] = useAsyncCallback<RegistrationClientsResult, Error, []>(
    useCallback(() => requestRegistrationClients(mx, botConfig), [mx, botConfig])
  );
  useEffect(() => {
    getClients();
  }, [getClients]);

  const clients: RegistrationClientInfo[] | undefined =
    clientsState.status === AsyncStatus.Success && clientsState.data.success
      ? clientsState.data.clients
      : undefined;

  // Once the bot's client list arrives, default to it unless a client was already
  // picked (configured, or chosen by the user before the list loaded).
  useEffect(() => {
    if (clientId === undefined && clients && clients.length > 0) {
      setClientId(clients[0].id);
    }
  }, [clients, clientId]);

  const [linkState, getLink] = useAsyncCallback<RegistrationLinkResult, Error, []>(
    useCallback(() => requestRegistrationLink(mx, botConfig, clientId), [mx, botConfig, clientId])
  );

  const loading = linkState.status === AsyncStatus.Loading;
  const clientsLoading =
    clientsState.status === AsyncStatus.Idle || clientsState.status === AsyncStatus.Loading;
  const result = linkState.status === AsyncStatus.Success ? linkState.data : undefined;
  const link = result?.success ? result.link : undefined;

  let error: string | undefined;
  if (linkState.status === AsyncStatus.Error) error = linkState.error.message;
  else if (result && !result.success) error = result.error.message;

  const copyLink = () => {
    if (!link) return;
    copyToClipboard(link);
    setCopied(true);
  };

  return {
    clients,
    clientsLoading,
    clientId,
    setClientId,
    loading,
    link,
    error,
    getLink,
    copied,
    copyLink,
  };
};
