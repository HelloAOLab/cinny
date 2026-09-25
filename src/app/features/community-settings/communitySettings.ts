import {
  HistoryVisibility,
  JoinRule,
  MatrixClient,
  RestrictedAllowType,
  Room,
} from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import { Membership, StateEvent } from '../../../types/matrix/room';
import {
  getPowersLevelFromMatrixEvent,
  IPowerLevels,
  readPowerLevel,
} from '../../hooks/usePowerLevels';
import { getRoomCreatorsForRoomId } from '../../hooks/useRoomCreators';
import { getRoomPermissionsAPI } from '../../hooks/useRoomPermissions';
import { getSpaceChildren, getStateEvent } from '../../utils/room';
import { isUserId } from '../../utils/matrix';
import {
  CommunityVisibility,
  getCommunityChildJoinRule,
} from '../create-community/createCommunity';

export const ADMIN_POWER_LEVEL = 100;
export const MODERATOR_POWER_LEVEL = 50;

/**
 * Whether a user administers a community: they created its space (on room
 * versions where creators have unlimited power) or hold admin power there.
 */
export const isCommunityAdmin = (
  creators: Set<string>,
  powerLevels: IPowerLevels,
  userId: string
): boolean => creators.has(userId) || readPowerLevel.user(powerLevels, userId) >= ADMIN_POWER_LEVEL;

/**
 * Visibility of a community as the /app shell presents it: public when anyone
 * can join the space, private otherwise (invite, knock, restricted...).
 */
export const getCommunityVisibility = (
  joinRule: RoomJoinRulesEventContent | undefined
): CommunityVisibility => (joinRule?.join_rule === JoinRule.Public ? 'public' : 'private');

export type StateEventChange = {
  type: StateEvent;
  content: Record<string, unknown>;
};

/**
 * State events to send to a community's space to switch its visibility,
 * mirroring how createCommunity sets up public and private spaces. Public
 * spaces are world-readable; going private only reverts history visibility
 * when it was world-readable, leaving any other choice alone.
 */
export const getSpaceVisibilityChanges = (
  visibility: CommunityVisibility,
  currentHistoryVisibility: string | undefined
): StateEventChange[] => {
  const changes: StateEventChange[] = [
    {
      type: StateEvent.RoomJoinRules,
      content: { join_rule: visibility === 'public' ? JoinRule.Public : JoinRule.Invite },
    },
  ];
  if (visibility === 'public' && currentHistoryVisibility !== 'world_readable') {
    changes.push({
      type: StateEvent.RoomHistoryVisibility,
      content: { history_visibility: 'world_readable' },
    });
  }
  if (visibility === 'private' && currentHistoryVisibility === 'world_readable') {
    changes.push({
      type: StateEvent.RoomHistoryVisibility,
      content: { history_visibility: 'shared' },
    });
  }
  return changes;
};

const isRestrictedToSpace = (joinRule: RoomJoinRulesEventContent, spaceId: string): boolean =>
  (joinRule.join_rule === JoinRule.Restricted || joinRule.join_rule === JoinRule.Knock) &&
  !!joinRule.allow?.some(
    (allow) => allow.type === RestrictedAllowType.RoomMembership && allow.room_id === spaceId
  );

/**
 * Whether a room inside a community should follow the community to a new
 * visibility. Only rooms that were open to "everyone the community is open
 * to" move: public rooms when the community goes private, and rooms
 * restricted to community members when it goes public. Invite-only rooms
 * were made private on purpose and are left alone.
 */
export const shouldUpdateChildJoinRule = (
  current: RoomJoinRulesEventContent | undefined,
  visibility: CommunityVisibility,
  spaceId: string
): boolean => {
  if (!current) return false;
  if (visibility === 'private') return current.join_rule === JoinRule.Public;
  return isRestrictedToSpace(current, spaceId);
};

export type CommunityRole = 'Admin' | 'Moderator';

export const getCommunityRole = (powerLevel: number): CommunityRole | undefined => {
  if (powerLevel >= ADMIN_POWER_LEVEL) return 'Admin';
  if (powerLevel >= MODERATOR_POWER_LEVEL) return 'Moderator';
  return undefined;
};

export type SortableMember = {
  userId: string;
  name: string;
  powerLevel: number;
};

/** Orders members by power (highest first), then by name. */
export const compareCommunityMembers = (a: SortableMember, b: SortableMember): number => {
  if (a.powerLevel !== b.powerLevel) return b.powerLevel - a.powerLevel;
  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  if (byName !== 0) return byName;
  return a.userId.localeCompare(b.userId);
};

export type SetCommunityVisibilityResult = {
  /** Rooms in the community whose join rule could not be updated. */
  failedRoomIds: string[];
};

/**
 * Switches a community's visibility: updates the space's join rule and
 * history visibility, then moves the joined rooms directly inside it that
 * should follow (see shouldUpdateChildJoinRule) and that the user may edit.
 * The space change must succeed; room failures are collected so one room
 * the user can't change doesn't hide that the community itself changed.
 */
export const setCommunityVisibility = async (
  mx: MatrixClient,
  space: Room,
  visibility: CommunityVisibility
): Promise<SetCommunityVisibilityResult> => {
  const userId = mx.getSafeUserId();
  const historyVisibility = getStateEvent(space, StateEvent.RoomHistoryVisibility)?.getContent()
    .history_visibility;

  const spaceChanges = getSpaceVisibilityChanges(visibility, historyVisibility);
  // Sequential so the join rule (the part that matters most) lands first.
  // eslint-disable-next-line no-restricted-syntax
  for (const change of spaceChanges) {
    // eslint-disable-next-line no-await-in-loop
    await mx.sendStateEvent(space.roomId, change.type as any, change.content);
  }

  const childRooms = getSpaceChildren(space)
    .map((roomId) => mx.getRoom(roomId))
    .filter((room): room is Room => !!room && !room.isSpaceRoom());

  const updates = childRooms.map(async (room): Promise<string | undefined> => {
    const joinRule = getStateEvent(
      room,
      StateEvent.RoomJoinRules
    )?.getContent<RoomJoinRulesEventContent>();
    if (!shouldUpdateChildJoinRule(joinRule, visibility, space.roomId)) return undefined;

    const powerLevels = getPowersLevelFromMatrixEvent(
      getStateEvent(room, StateEvent.RoomPowerLevels)
    );
    const permissions = getRoomPermissionsAPI(
      getRoomCreatorsForRoomId(mx, room.roomId),
      powerLevels
    );
    if (!permissions.stateEvent(StateEvent.RoomJoinRules, userId)) return room.roomId;

    try {
      await mx.sendStateEvent(
        room.roomId,
        StateEvent.RoomJoinRules as any,
        getCommunityChildJoinRule(visibility, space.roomId, room.getVersion())
      );
      return undefined;
    } catch {
      return room.roomId;
    }
  });

  const results = await Promise.all(updates);
  return { failedRoomIds: results.filter((roomId): roomId is string => !!roomId) };
};

/**
 * Turns what an admin typed into the invite field into a Matrix user ID.
 * Accepts a full ID ("@alice:example.org"), one missing its "@"
 * ("alice:example.org"), or a bare username ("alice" or "@alice"), which is
 * taken to be on `defaultServer` - usually the inviter's own homeserver.
 * Returns undefined when the input can't be a user ID.
 */
export const parseInviteUserId = (
  input: string,
  defaultServer: string | undefined
): string | undefined => {
  const value = input.trim();
  if (!value) return undefined;
  const withSigil = value.startsWith('@') ? value : `@${value}`;
  if (withSigil.includes(':')) return isUserId(withSigil) ? withSigil : undefined;
  if (!defaultServer) return undefined;
  const userId = `${withSigil}:${defaultServer}`;
  return isUserId(userId) ? userId : undefined;
};

/**
 * Why a user can't be invited given their current membership in the
 * community, or undefined when an invite can go ahead.
 */
export const getInviteBlockReason = (membership: string | undefined): string | undefined => {
  switch (membership) {
    case Membership.Join:
      return 'is already a member';
    case Membership.Invite:
      return 'has already been invited';
    case Membership.Ban:
      return 'is banned from this community';
    default:
      return undefined;
  }
};

export type ChildRoomInviteCheck = {
  encrypted: boolean;
  historyVisibility: string | undefined;
  inviterMembership: string | undefined;
  inviteeMembership: string | undefined;
  canInvite: boolean;
};

/**
 * Whether inviting someone to a community should also invite them to one of
 * its rooms. People joining a community reach its rooms through the space
 * (restricted join), which never gives them the keys for encrypted messages
 * sent before they joined: matrix-js-sdk only shares room history when
 * inviting someone. So we invite them to the encrypted rooms whose history
 * visibility lets new members read past messages, when we can.
 */
export const shouldInviteToChildRoom = ({
  encrypted,
  historyVisibility,
  inviterMembership,
  inviteeMembership,
  canInvite,
}: ChildRoomInviteCheck): boolean => {
  if (!encrypted || !canInvite) return false;
  if (inviterMembership !== Membership.Join) return false;
  // Unset history visibility defaults to shared.
  const visibility = historyVisibility ?? HistoryVisibility.Shared;
  if (visibility !== HistoryVisibility.Shared && visibility !== HistoryVisibility.WorldReadable) {
    return false;
  }
  return (
    inviteeMembership === undefined ||
    inviteeMembership === Membership.Leave ||
    inviteeMembership === Membership.Knock
  );
};

export type InviteToCommunityResult = {
  /** Rooms in the community the user could not be invited to. */
  failedRoomIds: string[];
};

/**
 * Invites a user to a community, then to its encrypted rooms (see
 * shouldInviteToChildRoom) so they get the room history's keys. The space
 * invite must succeed; room failures are collected so one room doesn't hide
 * that the community invite went through.
 */
export const inviteToCommunity = async (
  mx: MatrixClient,
  space: Room,
  userId: string
): Promise<InviteToCommunityResult> => {
  await mx.invite(space.roomId, userId);

  const myUserId = mx.getSafeUserId();
  const childRooms = getSpaceChildren(space)
    .map((roomId) => mx.getRoom(roomId))
    .filter((room): room is Room => !!room && !room.isSpaceRoom())
    .filter((room) => {
      const powerLevels = getPowersLevelFromMatrixEvent(
        getStateEvent(room, StateEvent.RoomPowerLevels)
      );
      const permissions = getRoomPermissionsAPI(
        getRoomCreatorsForRoomId(mx, room.roomId),
        powerLevels
      );
      return shouldInviteToChildRoom({
        encrypted: room.hasEncryptionStateEvent(),
        historyVisibility: room.getHistoryVisibility(),
        inviterMembership: room.getMyMembership(),
        inviteeMembership: room.getMember(userId)?.membership,
        canInvite: permissions.action('invite', myUserId),
      });
    });

  const results = await Promise.all(
    childRooms.map(async (room): Promise<string | undefined> => {
      try {
        await mx.invite(room.roomId, userId);
        return undefined;
      } catch {
        return room.roomId;
      }
    })
  );
  return { failedRoomIds: results.filter((roomId): roomId is string => !!roomId) };
};
