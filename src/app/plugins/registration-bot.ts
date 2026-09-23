/**
 * Client for the `115.registration.*` event pairs implemented by the registration bot
 * from https://github.com/HelloAOLab/matrix-bots/pull/20 (link minting) and
 * https://github.com/HelloAOLab/matrix-bots/pull/27 (client listing).
 *
 * The bot answers a `115.registration.get_link` request with a
 * `115.registration.link_generated` response, and a `115.registration.list_clients`
 * request with a `115.registration.clients` response — all of which travel as
 * ordinary room events inside a private, E2EE DM between the requester and the bot —
 * it refuses to answer anywhere else, since a minted token is a secret. See those
 * PRs' READMEs ("Registration links" section) for the full wire format.
 */
import {
  MatrixClient,
  MatrixEvent,
  MatrixEventEvent,
  Preset,
  Room,
  RoomEvent,
  RoomEventHandlerMap,
  RoomMemberEvent,
  RoomMemberEventHandlerMap,
  Visibility,
} from 'matrix-js-sdk';
import { addRoomIdToMDirect } from '../utils/matrix';
import { Membership } from '../../types/matrix/room';
import { createRoomEncryptionState } from '../components/create-room/utils';

export const EVENT_REGISTRATION_GET_LINK = '115.registration.get_link';
export const EVENT_REGISTRATION_LINK_GENERATED = '115.registration.link_generated';
export const EVENT_REGISTRATION_LIST_CLIENTS = '115.registration.list_clients';
export const EVENT_REGISTRATION_CLIENTS = '115.registration.clients';
export const REGISTRATION_REL_TYPE = '115.registration.response';

const DEFAULT_TIMEOUT_MS = 30000;

export type RegistrationBotConfig = {
  userId: string;
  homeserverId: string;
  clientId?: string;
};

export type RegistrationLinkRequestContent = {
  homeserver_id: string;
  client_id?: string;
  request_id?: string;
};

export type RegistrationLinkSuccess = {
  success: true;
  link: string;
  token?: string;
  clientId?: string;
};

export type RegistrationLinkFailure = {
  success: false;
  error: { code?: string; message: string };
};

export type RegistrationLinkResult = RegistrationLinkSuccess | RegistrationLinkFailure;

export type RegistrationClientInfo = {
  id: string;
  baseUrl: string;
};

export type RegistrationClientsRequestContent = {
  homeserver_id: string;
  client_id?: string;
  request_id?: string;
};

export type RegistrationClientsSuccess = {
  success: true;
  clients: RegistrationClientInfo[];
};

export type RegistrationClientsFailure = {
  success: false;
  error: { code?: string; message: string };
};

export type RegistrationClientsResult = RegistrationClientsSuccess | RegistrationClientsFailure;

export const generateRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export const buildRegistrationLinkRequestContent = (params: {
  homeserverId: string;
  clientId?: string;
  requestId?: string;
}): RegistrationLinkRequestContent => {
  const content: RegistrationLinkRequestContent = { homeserver_id: params.homeserverId };
  if (params.clientId) content.client_id = params.clientId;
  if (params.requestId) content.request_id = params.requestId;
  return content;
};

export const buildRegistrationClientsRequestContent = (params: {
  homeserverId: string;
  clientId?: string;
  requestId?: string;
}): RegistrationClientsRequestContent => {
  const content: RegistrationClientsRequestContent = { homeserver_id: params.homeserverId };
  if (params.clientId) content.client_id = params.clientId;
  if (params.requestId) content.request_id = params.requestId;
  return content;
};

/**
 * Whether `content` (from an event of type `eventType`) is the bot's answer to the
 * request event `requestEventId`. Matching is by `m.relates_to`, not `request_id` —
 * the latter is an optional, caller-chosen correlation id, the former is always set.
 */
export const isRegistrationLinkResponseTo = (
  eventType: string,
  content: Record<string, unknown>,
  requestEventId: string
): boolean => {
  if (eventType !== EVENT_REGISTRATION_LINK_GENERATED) return false;
  const relatesTo = content['m.relates_to'] as
    | { rel_type?: unknown; event_id?: unknown }
    | undefined;
  return relatesTo?.rel_type === REGISTRATION_REL_TYPE && relatesTo?.event_id === requestEventId;
};

export const parseRegistrationLinkResponse = (
  content: Record<string, unknown>
): RegistrationLinkResult => {
  if (content.success === true && typeof content.link === 'string') {
    return {
      success: true,
      link: content.link,
      token: typeof content.token === 'string' ? content.token : undefined,
      clientId: typeof content.client_id === 'string' ? content.client_id : undefined,
    };
  }
  const error = content.error as { code?: unknown; message?: unknown } | undefined;
  return {
    success: false,
    error: {
      code: typeof error?.code === 'string' ? error.code : undefined,
      message:
        typeof error?.message === 'string'
          ? error.message
          : 'The registration bot could not create a link.',
    },
  };
};

/**
 * Whether `content` (from an event of type `eventType`) is the bot's answer to the
 * request event `requestEventId`. Matching is by `m.relates_to`, the same convention
 * `isRegistrationLinkResponseTo` uses for the link exchange.
 */
export const isRegistrationClientsResponseTo = (
  eventType: string,
  content: Record<string, unknown>,
  requestEventId: string
): boolean => {
  if (eventType !== EVENT_REGISTRATION_CLIENTS) return false;
  const relatesTo = content['m.relates_to'] as
    | { rel_type?: unknown; event_id?: unknown }
    | undefined;
  return relatesTo?.rel_type === REGISTRATION_REL_TYPE && relatesTo?.event_id === requestEventId;
};

const asClientInfo = (entry: unknown): RegistrationClientInfo | undefined => {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const { id, base_url: baseUrl } = entry as Record<string, unknown>;
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

export const parseRegistrationClientsResponse = (
  content: Record<string, unknown>
): RegistrationClientsResult => {
  if (content.success === true) {
    const clients = parseClientInfoList(content.clients);
    if (clients) return { success: true, clients };
  }
  const error = content.error as { code?: unknown; message?: unknown } | undefined;
  return {
    success: false,
    error: {
      code: typeof error?.code === 'string' ? error.code : undefined,
      message:
        typeof error?.message === 'string'
          ? error.message
          : 'The registration bot could not list clients.',
    },
  };
};

/**
 * An existing room usable to talk to the registration bot: just the bot and us,
 * joined, E2EE. The bot refuses to answer in any other kind of room, so a room that
 * doesn't match this is not worth reusing.
 */
export const findBotDMRoom = (mx: MatrixClient, botUserId: string): Room | undefined =>
  mx
    .getRooms()
    .find(
      (room) =>
        room.getMyMembership() === Membership.Join &&
        room.hasEncryptionStateEvent() &&
        room.getMembers().length <= 2 &&
        room.getMember(botUserId)?.membership === Membership.Join
    );

const getOrCreateBotDMRoomId = async (mx: MatrixClient, botUserId: string): Promise<string> => {
  const existing = findBotDMRoom(mx, botUserId);
  if (existing) return existing.roomId;

  const result = await mx.createRoom({
    is_direct: true,
    invite: [botUserId],
    visibility: Visibility.Private,
    preset: Preset.TrustedPrivateChat,
    initial_state: [createRoomEncryptionState()],
  });
  await addRoomIdToMDirect(mx, result.room_id, botUserId);
  return result.room_id;
};

const waitForBotToJoin = (
  mx: MatrixClient,
  roomId: string,
  botUserId: string,
  timeoutMs: number
): Promise<void> => {
  const room = mx.getRoom(roomId);
  if (room?.getMember(botUserId)?.membership === Membership.Join) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    let cleanup: () => void;

    const handleMembership: RoomMemberEventHandlerMap[RoomMemberEvent.Membership] = (
      event,
      member
    ) => {
      if (member.roomId !== roomId || member.userId !== botUserId) return;
      if (member.membership !== Membership.Join) return;
      cleanup();
      resolve();
    };

    cleanup = () => {
      clearTimeout(timer);
      mx.removeListener(RoomMemberEvent.Membership, handleMembership);
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the registration bot to join.'));
    }, timeoutMs);

    mx.on(RoomMemberEvent.Membership, handleMembership);
  });
};

/**
 * Send the request event, then wait for the bot's answer.
 *
 * The listener is attached before the request is sent (and buffers whatever it
 * sees) so a response that lands before we learn our own event's id — a race that
 * really can happen with a fast bot on a local homeserver — is not missed.
 *
 * The room is E2EE, so the response arrives on the timeline as `m.room.encrypted`
 * and only exposes its real type/content once matrix-js-sdk finishes decrypting it
 * asynchronously — an event still mid-decryption is held back until it does.
 */
const sendAndAwaitResponse = <T>(
  mx: MatrixClient,
  roomId: string,
  requestEventType: string,
  content: Record<string, unknown>,
  timeoutMs: number,
  isResponseTo: (
    eventType: string,
    content: Record<string, unknown>,
    requestEventId: string
  ) => boolean,
  parseResponse: (content: Record<string, unknown>) => T
): Promise<T> => {
  type Buffered = { type: string; content: Record<string, unknown> };

  return new Promise((resolve, reject) => {
    let requestEventId: string | undefined;
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    let cleanup: () => void;
    const buffered: Buffered[] = [];
    const decryptingListeners = new Map<MatrixEvent, () => void>();

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      action();
    };

    const handleDecryptedEvent = (event: MatrixEvent) => {
      const type = event.getType();
      const eventContent = event.getContent();
      if (requestEventId === undefined) {
        buffered.push({ type, content: eventContent });
        return;
      }
      if (!isResponseTo(type, eventContent, requestEventId)) return;
      finish(() => resolve(parseResponse(eventContent)));
    };

    const handleTimeline: RoomEventHandlerMap[RoomEvent.Timeline] = (event, room) => {
      if (room?.roomId !== roomId) return;
      if (event.isEncrypted() && event.getClearContent() === null) {
        const onDecrypted = () => {
          decryptingListeners.delete(event);
          if (settled) return;
          handleDecryptedEvent(event);
        };
        decryptingListeners.set(event, onDecrypted);
        event.once(MatrixEventEvent.Decrypted, onDecrypted);
        return;
      }
      handleDecryptedEvent(event);
    };

    cleanup = () => {
      clearTimeout(timer);
      mx.removeListener(RoomEvent.Timeline, handleTimeline);
      decryptingListeners.forEach((listener, event) =>
        event.off(MatrixEventEvent.Decrypted, listener)
      );
      decryptingListeners.clear();
    };

    timer = setTimeout(() => {
      finish(() =>
        reject(new Error('Timed out waiting for a response from the registration bot.'))
      );
    }, timeoutMs);

    mx.on(RoomEvent.Timeline, handleTimeline);

    mx.sendEvent(roomId, requestEventType as any, content)
      .then((res) => {
        requestEventId = res.event_id;
        const match = buffered.find((b) => isResponseTo(b.type, b.content, res.event_id));
        if (match) finish(() => resolve(parseResponse(match.content)));
      })
      .catch((error) => finish(() => reject(error)));
  });
};

/**
 * Ask the registration bot for a single-use registration link, end to end: find or
 * open a DM with it, wait for it to join, send the request, and wait for the answer.
 *
 * `clientId` overrides `botConfig.clientId` — the caller's explicit choice (e.g. from
 * a client picked via `requestRegistrationClients`) wins over the configured default.
 */
export const requestRegistrationLink = async (
  mx: MatrixClient,
  botConfig: RegistrationBotConfig,
  clientId: string | undefined = botConfig.clientId,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RegistrationLinkResult> => {
  const roomId = await getOrCreateBotDMRoomId(mx, botConfig.userId);
  await waitForBotToJoin(mx, roomId, botConfig.userId, timeoutMs);

  const content = buildRegistrationLinkRequestContent({
    homeserverId: botConfig.homeserverId,
    clientId,
    requestId: generateRequestId(),
  });

  return sendAndAwaitResponse(
    mx,
    roomId,
    EVENT_REGISTRATION_GET_LINK,
    content,
    timeoutMs,
    isRegistrationLinkResponseTo,
    parseRegistrationLinkResponse
  );
};

/**
 * Ask the registration bot which clients it can mint a registration link for, end to
 * end: find or open a DM with it, wait for it to join, send the request, and wait for
 * the answer. Mirrors `requestRegistrationLink`, using the `115.registration.list_clients`
 * / `115.registration.clients` event pair instead.
 */
export const requestRegistrationClients = async (
  mx: MatrixClient,
  botConfig: RegistrationBotConfig,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<RegistrationClientsResult> => {
  const roomId = await getOrCreateBotDMRoomId(mx, botConfig.userId);
  await waitForBotToJoin(mx, roomId, botConfig.userId, timeoutMs);

  const content = buildRegistrationClientsRequestContent({
    homeserverId: botConfig.homeserverId,
    requestId: generateRequestId(),
  });

  return sendAndAwaitResponse(
    mx,
    roomId,
    EVENT_REGISTRATION_LIST_CLIENTS,
    content,
    timeoutMs,
    isRegistrationClientsResponseTo,
    parseRegistrationClientsResponse
  );
};
