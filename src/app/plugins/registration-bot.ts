/**
 * Client for the registration bot's HTTP API, from
 * https://github.com/HelloAOLab/matrix-bots/pull/45:
 *
 *   POST <apiUrl>/api/registration-link   { "client_id"?: string }
 *   GET  <apiUrl>/api/clients[?client_id=<id>]
 *
 * Both are authenticated with `Authorization: Bearer <access_token>`, where the token
 * is an OpenID token we get from our own homeserver
 * (`POST /_matrix/client/v3/user/{userId}/openid/request_token`). Only its
 * `access_token` is sent — the bot verifies it against the one homeserver it lives on,
 * so only users of that homeserver can use it.
 *
 * Answers are `{ success: true, ... }` or `{ success: false, error: { code, message } }`,
 * with a matching HTTP status. See the bot's README ("HTTP API") for the full format.
 */
import { MatrixClient } from 'matrix-js-sdk';

const DEFAULT_TIMEOUT_MS = 30000;

/** Refresh an OpenID token this long before the homeserver says it expires. */
const OPENID_TOKEN_EXPIRY_MARGIN_MS = 60000;

export type RegistrationBotConfig = {
  /** Base URL of the registration bot's Worker, e.g. `https://registration-bot.example.dev`. */
  apiUrl: string;
  clientId?: string;
};

export type RegistrationLinkRequestBody = {
  client_id?: string;
};

export type RegistrationLinkSuccess = {
  success: true;
  link: string;
  token?: string;
  clientId?: string;
};

export type RegistrationError = { code?: string; message: string };

export type RegistrationLinkFailure = {
  success: false;
  error: RegistrationError;
};

export type RegistrationLinkResult = RegistrationLinkSuccess | RegistrationLinkFailure;

export type RegistrationClientInfo = {
  id: string;
  baseUrl: string;
};

export type RegistrationClientsSuccess = {
  success: true;
  clients: RegistrationClientInfo[];
};

export type RegistrationClientsFailure = {
  success: false;
  error: RegistrationError;
};

export type RegistrationClientsResult = RegistrationClientsSuccess | RegistrationClientsFailure;

const LINK_FALLBACK_MESSAGE = 'The registration bot could not create a link.';
const CLIENTS_FALLBACK_MESSAGE = 'The registration bot could not list clients.';

const joinUrl = (apiUrl: string, path: string): string => `${apiUrl.replace(/\/+$/, '')}${path}`;

export const buildRegistrationLinkUrl = (apiUrl: string): string =>
  joinUrl(apiUrl, '/api/registration-link');

export const buildRegistrationClientsUrl = (apiUrl: string, clientId?: string): string => {
  const url = joinUrl(apiUrl, '/api/clients');
  return clientId ? `${url}?client_id=${encodeURIComponent(clientId)}` : url;
};

export const buildRegistrationLinkRequestBody = (params: {
  clientId?: string;
}): RegistrationLinkRequestBody => {
  const body: RegistrationLinkRequestBody = {};
  if (params.clientId) body.client_id = params.clientId;
  return body;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const parseError = (body: Record<string, unknown> | undefined, fallback: string) => {
  const error = asRecord(body?.error);
  return {
    code: typeof error?.code === 'string' ? error.code : undefined,
    message: typeof error?.message === 'string' ? error.message : fallback,
  };
};

export const parseRegistrationLinkResponse = (value: unknown): RegistrationLinkResult => {
  const body = asRecord(value);
  if (body?.success === true && typeof body.link === 'string') {
    return {
      success: true,
      link: body.link,
      token: typeof body.token === 'string' ? body.token : undefined,
      clientId: typeof body.client_id === 'string' ? body.client_id : undefined,
    };
  }
  return { success: false, error: parseError(body, LINK_FALLBACK_MESSAGE) };
};

const asClientInfo = (entry: unknown): RegistrationClientInfo | undefined => {
  const record = asRecord(entry);
  if (!record) return undefined;
  const { id, base_url: baseUrl } = record;
  if (typeof id !== 'string' || typeof baseUrl !== 'string') return undefined;
  return { id, baseUrl };
};

const parseClientInfoList = (value: unknown): RegistrationClientInfo[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const clients = value.map(asClientInfo);
  return clients.every((client): client is RegistrationClientInfo => client !== undefined)
    ? clients
    : undefined;
};

export const parseRegistrationClientsResponse = (value: unknown): RegistrationClientsResult => {
  const body = asRecord(value);
  if (body?.success === true) {
    const clients = parseClientInfoList(body.clients);
    if (clients) return { success: true, clients };
  }
  return { success: false, error: parseError(body, CLIENTS_FALLBACK_MESSAGE) };
};

type CachedOpenIdToken = { accessToken: string; expiresAt: number };

export const isOpenIdTokenFresh = (cached: CachedOpenIdToken | undefined, now: number): boolean =>
  cached !== undefined && cached.expiresAt - OPENID_TOKEN_EXPIRY_MARGIN_MS > now;

/**
 * OpenID tokens last about an hour, and one UI open asks the bot at least twice (list
 * clients, then mint), so reuse a token until shortly before it expires.
 */
const openIdTokenCache = new WeakMap<MatrixClient, CachedOpenIdToken>();

const getOpenIdAccessToken = async (mx: MatrixClient, forceRefresh: boolean): Promise<string> => {
  const cached = openIdTokenCache.get(mx);
  if (!forceRefresh && cached && isOpenIdTokenFresh(cached, Date.now())) {
    return cached.accessToken;
  }
  const token = await mx.getOpenIdToken();
  openIdTokenCache.set(mx, {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  });
  return token.access_token;
};

const fetchWithTimeout = async (
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Timed out waiting for a response from the registration bot.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

/**
 * Call the bot with a fresh-enough OpenID token and parse its answer. A `401` on a
 * cached token is retried once with a new one, in case the homeserver dropped it early.
 */
const callRegistrationApi = async <T>(
  mx: MatrixClient,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  parse: (body: unknown) => T
): Promise<T> => {
  const send = async (forceRefresh: boolean) => {
    const accessToken = await getOpenIdAccessToken(mx, forceRefresh);
    return fetchWithTimeout(
      url,
      {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
      },
      timeoutMs
    );
  };

  let response = await send(false);
  if (response.status === 401) response = await send(true);
  return parse(await readJson(response));
};

/**
 * Ask the registration bot for a single-use registration link.
 *
 * `clientId` overrides `botConfig.clientId` — the caller's explicit choice (e.g. from
 * a client picked via `requestRegistrationClients`) wins over the configured default.
 */
export const requestRegistrationLink = (
  mx: MatrixClient,
  botConfig: RegistrationBotConfig,
  clientId: string | undefined = botConfig.clientId,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RegistrationLinkResult> =>
  callRegistrationApi(
    mx,
    buildRegistrationLinkUrl(botConfig.apiUrl),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRegistrationLinkRequestBody({ clientId })),
    },
    timeoutMs,
    parseRegistrationLinkResponse
  );

/** Ask the registration bot which clients it can mint a registration link for. */
export const requestRegistrationClients = (
  mx: MatrixClient,
  botConfig: RegistrationBotConfig,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RegistrationClientsResult> =>
  callRegistrationApi(
    mx,
    buildRegistrationClientsUrl(botConfig.apiUrl),
    { method: 'GET' },
    timeoutMs,
    parseRegistrationClientsResponse
  );
