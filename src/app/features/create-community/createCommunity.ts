import {
  ClientEvent,
  ICreateRoomOpts,
  ICreateRoomStateEvent,
  JoinRule,
  MatrixClient,
  RestrictedAllowType,
  Room,
  RoomStateEvent,
} from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import { RoomType, StateEvent } from '../../../types/matrix/room';
import { getMxIdServer, restrictedSupported } from '../../utils/matrix';
import { getSpaceChildren } from '../../utils/room';
import { POSTS_ROOM_NAME_SUFFIX } from '../app-feed/findPostsRoom';

export type CommunityVisibility = 'public' | 'private';

export type CreateCommunityData = {
  name: string;
  description?: string;
  visibility: CommunityVisibility;
  /**
   * Room version to create every room with (the server's default). When
   * unknown, the server picks its default.
   */
  roomVersion?: string;
};

export type CreateCommunityResult = {
  spaceId: string;
  postsRoomId: string;
  chatRoomId: string;
};

/**
 * Name of a community's feed room: a lowercase, dash-separated slug of the
 * community name ending in "-posts", which is what the /app feed looks for.
 */
export const getPostsRoomName = (communityName: string): string => {
  const slug = communityName
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'community'}${POSTS_ROOM_NAME_SUFFIX}`;
};

export const COMMUNITY_CHAT_ROOM_NAME = 'General';

/**
 * Join rule for a room inside a community. Public communities get public
 * rooms; private ones restrict joining to community members when the room
 * version allows it, and fall back to invite-only otherwise.
 */
export const getCommunityChildJoinRule = (
  visibility: CommunityVisibility,
  spaceId: string,
  roomVersion: string | undefined
): RoomJoinRulesEventContent => {
  if (visibility === 'public') return { join_rule: JoinRule.Public };
  // Every server default room version in use today supports restricted rooms.
  if (roomVersion === undefined || restrictedSupported(roomVersion)) {
    return {
      join_rule: JoinRule.Restricted,
      allow: [{ type: RestrictedAllowType.RoomMembership, room_id: spaceId }],
    };
  }
  return { join_rule: JoinRule.Invite };
};

const joinRuleState = (content: RoomJoinRulesEventContent): ICreateRoomStateEvent => ({
  type: StateEvent.RoomJoinRules,
  state_key: '',
  content,
});

export const createCommunitySpaceOptions = (data: CreateCommunityData): ICreateRoomOpts => ({
  room_version: data.roomVersion,
  name: data.name.trim(),
  topic: data.description?.trim() || undefined,
  creation_content: { type: RoomType.Space },
  // Only moderators post into the space itself; members talk in its rooms.
  power_level_content_override: { events_default: 50 },
  initial_state: [
    joinRuleState({
      join_rule: data.visibility === 'public' ? JoinRule.Public : JoinRule.Invite,
    }),
    ...(data.visibility === 'public'
      ? [
          {
            type: StateEvent.RoomHistoryVisibility,
            state_key: '',
            content: { history_visibility: 'world_readable' },
          },
        ]
      : []),
  ],
});

export const createCommunityChildRoomOptions = (
  data: CreateCommunityData,
  spaceId: string,
  name: string,
  via: string[]
): ICreateRoomOpts => ({
  room_version: data.roomVersion,
  name,
  initial_state: [
    {
      type: StateEvent.SpaceParent,
      state_key: spaceId,
      content: { canonical: true, via },
    },
    joinRuleState(getCommunityChildJoinRule(data.visibility, spaceId, data.roomVersion)),
  ],
});

/**
 * Creates a community: a space plus the rooms the /app shell expects inside
 * it - a "<name>-posts" room backing the feed and a general chat room.
 */
export const createCommunity = async (
  mx: MatrixClient,
  data: CreateCommunityData
): Promise<CreateCommunityResult> => {
  const server = getMxIdServer(mx.getSafeUserId());
  const via = server ? [server] : [];

  const { room_id: spaceId } = await mx.createRoom(createCommunitySpaceOptions(data));

  const addChild = async (name: string, suggested: boolean): Promise<string> => {
    const { room_id: roomId } = await mx.createRoom(
      createCommunityChildRoomOptions(data, spaceId, name, via)
    );
    await mx.sendStateEvent(
      spaceId,
      StateEvent.SpaceChild as any,
      { auto_join: false, suggested, via },
      roomId
    );
    return roomId;
  };

  // The posts room is added first so it is the first "-posts" child the
  // feed finds.
  const postsRoomId = await addChild(getPostsRoomName(data.name), true);
  const chatRoomId = await addChild(COMMUNITY_CHAT_ROOM_NAME, true);

  return { spaceId, postsRoomId, chatRoomId };
};

/**
 * Whether the client has synced enough of a new community for the /app shell
 * to render it: the space and its posts room are joined, and the space's
 * m.space.child event for the posts room has arrived.
 */
export const isCommunitySynced = (
  result: CreateCommunityResult,
  getRoom: (roomId: string) => Room | null | undefined,
  getChildren: (space: Room) => string[] = getSpaceChildren
): boolean => {
  const space = getRoom(result.spaceId);
  if (!space || !getRoom(result.postsRoomId)) return false;
  return getChildren(space).includes(result.postsRoomId);
};

/**
 * Resolves once the new community has synced (see isCommunitySynced), or
 * after `timeoutMs` so a slow sync never leaves the UI stuck.
 */
export const waitForCommunitySync = (
  mx: MatrixClient,
  result: CreateCommunityResult,
  timeoutMs = 15000
): Promise<void> =>
  new Promise((resolve) => {
    let timedOut = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const handleChange = () => {
      if (!timedOut && !isCommunitySynced(result, (roomId) => mx.getRoom(roomId))) return;
      clearTimeout(timeout);
      mx.removeListener(ClientEvent.Sync, handleChange);
      mx.removeListener(ClientEvent.Room, handleChange);
      mx.removeListener(RoomStateEvent.Events, handleChange);
      resolve();
    };
    mx.on(ClientEvent.Sync, handleChange);
    mx.on(ClientEvent.Room, handleChange);
    mx.on(RoomStateEvent.Events, handleChange);
    timeout = setTimeout(() => {
      timedOut = true;
      handleChange();
    }, timeoutMs);
    handleChange();
  });
