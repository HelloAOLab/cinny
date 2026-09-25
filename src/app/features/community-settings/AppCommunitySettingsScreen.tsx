import React, { FormEventHandler, useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { MatrixError, Room, RoomMember } from 'matrix-js-sdk';
import { useQuery } from '@tanstack/react-query';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { usePowerLevels, readPowerLevel } from '../../hooks/usePowerLevels';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useRoomAvatar, useRoomJoinRule, useRoomName } from '../../hooks/useRoomMeta';
import { useRoomMembers } from '../../hooks/useRoomMembers';
import { useFilePicker } from '../../hooks/useFilePicker';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useAlive } from '../../hooks/useAlive';
import { useRecursiveChildScopeFactory, useSpaceChildren } from '../../state/hooks/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { StateEvent } from '../../../types/matrix/room';
import { getMxIdServer, mxcUrlToHttp } from '../../utils/matrix';
import { getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { getAppCommunityChatRoomPath, getAppCommunityPath } from '../../pages/pathUtils';
import { CommunityVisibility } from '../create-community/createCommunity';
import { getUnjoinedChatRooms } from '../app-chat/chatRooms';
import {
  compareCommunityMembers,
  getCommunityRole,
  getCommunityVisibility,
  getInviteBlockReason,
  inviteToCommunity,
  InviteToCommunityResult,
  parseInviteUserId,
  setCommunityVisibility,
  SetCommunityVisibilityResult,
} from './communitySettings';
import { useIsCommunityAdmin } from './useIsCommunityAdmin';
import * as css from './AppCommunitySettings.css';

const HIERARCHY_LIMIT = 100;
const MEMBERS_PAGE_SIZE = 50;

const VISIBILITY_OPTIONS: { value: CommunityVisibility; label: string; subtitle: string }[] = [
  {
    value: 'private',
    label: 'Private',
    subtitle: 'Only people you invite can join',
  },
  {
    value: 'public',
    label: 'Public',
    subtitle: 'Anyone can find, join and read posts',
  },
];

const pluralize = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

type SectionProps = {
  community: Room;
  canEdit: (eventType: StateEvent) => boolean;
};

function ProfileSection({ community, canEdit }: SectionProps) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const useAuthentication = useMediaAuthentication();
  const name = useRoomName(community);
  const avatarMxc = useRoomAvatar(community);
  const canEditName = canEdit(StateEvent.RoomName);
  const canEditAvatar = canEdit(StateEvent.RoomAvatar);

  const [nameDraft, setNameDraft] = useState<string>();
  const nameValue = nameDraft ?? name;
  const nameChanged = nameDraft !== undefined && nameDraft.trim() !== name;

  const [nameState, saveName] = useAsyncCallback<void, MatrixError, [string]>(
    useCallback(
      async (newName) => {
        await mx.sendStateEvent(community.roomId, StateEvent.RoomName as any, { name: newName });
      },
      [mx, community.roomId]
    )
  );
  const savingName = nameState.status === AsyncStatus.Loading;

  const handleNameSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const newName = nameValue.trim();
    if (!nameChanged || !newName || savingName) return;
    saveName(newName).then(() => {
      if (alive()) setNameDraft(undefined);
    });
  };

  const [avatarState, setAvatar] = useAsyncCallback<void, MatrixError, [File | null]>(
    useCallback(
      async (file) => {
        let url: string | undefined;
        if (file) {
          const upload = await mx.uploadContent(file, { name: file.name, type: file.type });
          url = upload.content_uri;
        }
        await mx.sendStateEvent(community.roomId, StateEvent.RoomAvatar as any, url ? { url } : {});
      },
      [mx, community.roomId]
    )
  );
  const savingAvatar = avatarState.status === AsyncStatus.Loading;
  const pickAvatar = useFilePicker(
    useCallback((file: File) => setAvatar(file), [setAvatar]),
    false
  );

  const avatarUrl = avatarMxc
    ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 192, 192, 'crop') ?? undefined
    : undefined;

  return (
    <section className={css.Section}>
      <span className={css.SectionTitle}>Profile</span>
      <div className={css.Card}>
        <div className={css.AvatarRow}>
          <span className={css.LargeAvatar}>
            {avatarUrl ? (
              <img className={css.AvatarImage} src={avatarUrl} alt="" />
            ) : (
              nameInitials(name, 2)
            )}
          </span>
          <div className={css.AvatarActions}>
            <button
              type="button"
              className={css.SecondaryButton}
              disabled={!canEditAvatar || savingAvatar}
              onClick={() => pickAvatar('image/*')}
            >
              {savingAvatar ? 'Saving…' : 'Change avatar'}
            </button>
            {avatarMxc && (
              <button
                type="button"
                className={css.DangerTextButton}
                disabled={!canEditAvatar || savingAvatar}
                onClick={() => setAvatar(null)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        {avatarState.status === AsyncStatus.Error && (
          <span className={css.Error}>
            {avatarState.error.message || 'Failed to update avatar'}
          </span>
        )}

        <form className={css.Field} onSubmit={handleNameSubmit}>
          <span className={css.Label} id="community-settings-name-label">
            Name
          </span>
          <div className={css.InputRow}>
            <input
              aria-labelledby="community-settings-name-label"
              className={css.Input}
              value={nameValue}
              onChange={(evt) => setNameDraft(evt.target.value)}
              autoComplete="off"
              maxLength={255}
              required
              readOnly={!canEditName}
              disabled={savingName}
            />
            <button
              type="submit"
              className={css.PrimaryButton}
              disabled={!canEditName || !nameChanged || !nameValue.trim() || savingName}
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
          {nameState.status === AsyncStatus.Error && (
            <span className={css.Error}>{nameState.error.message || 'Failed to rename'}</span>
          )}
        </form>
      </div>
    </section>
  );
}

function VisibilitySection({ community, canEdit }: SectionProps) {
  const mx = useMatrixClient();
  const joinRule = useRoomJoinRule(community);
  const visibility = getCommunityVisibility(joinRule);
  const canEditVisibility = canEdit(StateEvent.RoomJoinRules);

  const [changeState, changeVisibility] = useAsyncCallback<
    SetCommunityVisibilityResult,
    MatrixError,
    [CommunityVisibility]
  >(
    useCallback(
      (newVisibility) => setCommunityVisibility(mx, community, newVisibility),
      [mx, community]
    )
  );
  const changing = changeState.status === AsyncStatus.Loading;
  const failedRooms =
    changeState.status === AsyncStatus.Success ? changeState.data.failedRoomIds.length : 0;

  return (
    <section className={css.Section}>
      <span className={css.SectionTitle} id="community-settings-visibility">
        Visibility
      </span>
      <div
        className={css.Options}
        role="radiogroup"
        aria-labelledby="community-settings-visibility"
      >
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={visibility === option.value}
            className={css.Option}
            disabled={!canEditVisibility || changing}
            onClick={() => option.value !== visibility && changeVisibility(option.value)}
          >
            <div className={css.OptionTitle}>{option.label}</div>
            <div className={css.OptionSubtitle}>{option.subtitle}</div>
          </button>
        ))}
      </div>
      {changing && <span className={css.Hint}>Updating visibility…</span>}
      {changeState.status === AsyncStatus.Error && (
        <span className={css.Error}>
          {changeState.error.message || 'Failed to change visibility'}
        </span>
      )}
      {failedRooms > 0 && (
        <span className={css.Error}>
          {pluralize(failedRooms, 'room', 'rooms')} in this community couldn&apos;t be updated.
        </span>
      )}
    </section>
  );
}

type RoomRowProps = {
  name: string;
  avatarUrl?: string;
  subtitle: string;
  joined: boolean;
  to?: string;
};

function RoomRow({ name, avatarUrl, subtitle, joined, to }: RoomRowProps) {
  const content = (
    <>
      <span className={css.Avatar}>
        {avatarUrl ? (
          <img className={css.AvatarImage} src={avatarUrl} alt="" />
        ) : (
          nameInitials(name, 2)
        )}
      </span>
      <span className={css.RowText}>
        <span className={css.RowTitle}>{name}</span>
        <span className={css.RowSubtitle}>{subtitle}</span>
      </span>
      {!joined && <span className={css.Tag}>Not joined</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={css.Row}>
        {content}
      </Link>
    );
  }
  return <div className={css.Row}>{content}</div>;
}

function RoomsSection({ community }: { community: Room }) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const allRooms = useAtomValue(allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);

  const joinedRoomIds = useSpaceChildren(
    allRoomsAtom,
    community.roomId,
    useRecursiveChildScopeFactory(mx, roomToParents)
  );
  const joinedRooms = useMemo(
    () =>
      joinedRoomIds
        .map((roomId) => mx.getRoom(roomId))
        .filter((room): room is Room => !!room && !room.isSpaceRoom())
        .sort((a, b) => a.name.localeCompare(b.name)),
    [mx, joinedRoomIds]
  );

  const { data: hierarchy } = useQuery({
    queryKey: [community.roomId, 'app-chat-hierarchy'],
    queryFn: () => mx.getRoomHierarchy(community.roomId, HIERARCHY_LIMIT),
    staleTime: 60 * 1000,
  });
  const unjoinedRooms = useMemo(
    () =>
      hierarchy
        ? getUnjoinedChatRooms(community.roomId, hierarchy.rooms, (roomId) =>
            allRooms.includes(roomId)
          )
        : [],
    [hierarchy, community.roomId, allRooms]
  );

  const total = joinedRooms.length + unjoinedRooms.length;

  return (
    <section className={css.Section}>
      <span className={css.SectionTitle}>Rooms · {total}</span>
      {total === 0 && <span className={css.Hint}>This community has no rooms yet.</span>}
      {joinedRooms.map((room) => (
        <RoomRow
          key={room.roomId}
          name={room.name}
          avatarUrl={getRoomAvatarUrl(mx, room, 96, useAuthentication)}
          subtitle={pluralize(room.getJoinedMemberCount(), 'member', 'members')}
          joined
          to={getAppCommunityChatRoomPath(community.roomId, room.roomId)}
        />
      ))}
      {unjoinedRooms.map((room) => (
        <RoomRow
          key={room.roomId}
          name={room.name}
          avatarUrl={
            room.avatarUrl
              ? mxcUrlToHttp(mx, room.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
              : undefined
          }
          subtitle={pluralize(room.memberCount, 'member', 'members')}
          joined={false}
        />
      ))}
    </section>
  );
}

function InviteSection({ community, canInvite }: { community: Room; canInvite: boolean }) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState<string>();
  const [invited, setInvited] = useState<string>();
  const defaultServer = getMxIdServer(mx.getSafeUserId());

  const [inviteState, invite] = useAsyncCallback<InviteToCommunityResult, MatrixError, [string]>(
    useCallback((userId) => inviteToCommunity(mx, community, userId), [mx, community])
  );
  const inviting = inviteState.status === AsyncStatus.Loading;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    if (inviting || !input.trim()) return;
    setInvited(undefined);

    const userId = parseInviteUserId(input, defaultServer);
    if (!userId) {
      setInvalid('Enter a username like "alice" or a full ID like "@alice:example.org".');
      return;
    }
    const blockReason = getInviteBlockReason(community.getMember(userId)?.membership);
    if (blockReason) {
      setInvalid(`${userId} ${blockReason}.`);
      return;
    }
    setInvalid(undefined);
    invite(userId).then(() => {
      if (!alive()) return;
      setInput('');
      setInvited(userId);
    });
  };

  return (
    <section className={css.Section}>
      <span className={css.SectionTitle} id="community-settings-invite-label">
        Invite people
      </span>
      <form className={css.Card} onSubmit={handleSubmit}>
        <div className={css.InputRow}>
          <input
            aria-labelledby="community-settings-invite-label"
            className={css.Input}
            value={input}
            onChange={(evt) => {
              setInput(evt.target.value);
              setInvalid(undefined);
            }}
            placeholder={defaultServer ? `username or @name:${defaultServer}` : '@name:server'}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={!canInvite}
            disabled={inviting}
          />
          <button
            type="submit"
            className={css.PrimaryButton}
            disabled={!canInvite || !input.trim() || inviting}
          >
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
        </div>
        {!canInvite && (
          <span className={css.Hint}>You don&apos;t have permission to invite people.</span>
        )}
        {invalid && <span className={css.Error}>{invalid}</span>}
        {inviteState.status === AsyncStatus.Error && (
          <span className={css.Error}>{inviteState.error.message || 'Failed to invite'}</span>
        )}
        {invited && inviteState.status === AsyncStatus.Success && (
          <span className={css.Success}>Invited {invited}.</span>
        )}
        {invited &&
          inviteState.status === AsyncStatus.Success &&
          inviteState.data.failedRoomIds.length > 0 && (
            <span className={css.Hint}>
              Couldn&apos;t invite them to{' '}
              {pluralize(inviteState.data.failedRoomIds.length, 'room', 'rooms')}, so they may not
              see older messages there.
            </span>
          )}
      </form>
    </section>
  );
}

function InvitedMemberRow({
  community,
  member,
  canRevoke,
}: {
  community: Room;
  member: RoomMember;
  canRevoke: boolean;
}) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [revokeState, revoke] = useAsyncCallback<void, MatrixError, []>(
    useCallback(async () => {
      await mx.kick(community.roomId, member.userId);
    }, [mx, community.roomId, member.userId])
  );
  const revoking =
    revokeState.status === AsyncStatus.Loading || revokeState.status === AsyncStatus.Success;
  const name = member.name || member.userId;
  const avatarMxc = member.getMxcAvatarUrl();
  const avatarUrl = avatarMxc
    ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  return (
    <div className={css.Row}>
      <span className={`${css.Avatar} ${css.AvatarRound}`}>
        {avatarUrl ? (
          <img className={css.AvatarImage} src={avatarUrl} alt="" />
        ) : (
          nameInitials(name, 2)
        )}
      </span>
      <span className={css.RowText}>
        <span className={css.RowTitle}>{name}</span>
        {revokeState.status === AsyncStatus.Error ? (
          <span className={css.Error}>{revokeState.error.message || 'Failed to revoke'}</span>
        ) : (
          <span className={css.RowSubtitle}>{member.userId}</span>
        )}
      </span>
      {canRevoke && (
        <button
          type="button"
          className={css.DangerTextButton}
          disabled={revoking}
          onClick={() => revoke()}
        >
          {revoking ? 'Revoking…' : 'Revoke'}
        </button>
      )}
    </div>
  );
}

function MembersSection({ community, canRevoke }: { community: Room; canRevoke: boolean }) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const powerLevels = usePowerLevels(community);
  const creators = useRoomCreators(community);
  const members = useRoomMembers(mx, community.roomId);
  const [limit, setLimit] = useState(MEMBERS_PAGE_SIZE);
  const myUserId = mx.getSafeUserId();

  const sortedMembers = useMemo(
    () =>
      members
        .filter((member) => member.membership === 'join')
        .map((member) => ({
          member,
          userId: member.userId,
          name: member.name || member.userId,
          // Creators outrank everyone on room versions that give them unlimited power.
          powerLevel: creators.has(member.userId)
            ? Infinity
            : readPowerLevel.user(powerLevels, member.userId),
        }))
        .sort(compareCommunityMembers),
    [members, powerLevels, creators]
  );
  const invitedMembers = useMemo(
    () =>
      members
        .filter((member) => member.membership === 'invite')
        .sort((a, b) => (a.name || a.userId).localeCompare(b.name || b.userId)),
    [members]
  );

  return (
    <section className={css.Section}>
      <span className={css.SectionTitle}>Members · {sortedMembers.length}</span>
      {sortedMembers.slice(0, limit).map(({ member, userId, name, powerLevel }) => {
        const avatarMxc = member.getMxcAvatarUrl();
        const avatarUrl = avatarMxc
          ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 96, 96, 'crop') ?? undefined
          : undefined;
        const role = creators.has(userId) ? 'Admin' : getCommunityRole(powerLevel);
        return (
          <div key={userId} className={css.Row}>
            <span className={`${css.Avatar} ${css.AvatarRound}`}>
              {avatarUrl ? (
                <img className={css.AvatarImage} src={avatarUrl} alt="" />
              ) : (
                nameInitials(name, 2)
              )}
            </span>
            <span className={css.RowText}>
              <span className={css.RowTitle}>
                {name}
                {userId === myUserId && <span className={css.You}> (you)</span>}
              </span>
              <span className={css.RowSubtitle}>{userId}</span>
            </span>
            {role && <span className={css.Tag}>{role}</span>}
          </div>
        );
      })}
      {sortedMembers.length > limit && (
        <button
          type="button"
          className={css.SecondaryButton}
          onClick={() => setLimit((l) => l + MEMBERS_PAGE_SIZE)}
        >
          Show more
        </button>
      )}
      {invitedMembers.length > 0 && (
        <>
          <span className={`${css.SectionTitle} ${css.SubsectionTitle}`}>
            Invited · {invitedMembers.length}
          </span>
          {invitedMembers.map((member) => (
            <InvitedMemberRow
              key={member.userId}
              community={community}
              member={member}
              canRevoke={canRevoke}
            />
          ))}
        </>
      )}
    </section>
  );
}

function BackToCommunity({ communityId }: { communityId: string }) {
  return (
    <Link to={getAppCommunityPath(communityId)} className={css.BackLink} aria-label="Back">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}

/**
 * Settings page for a community in the /app shell, for its admins: rename
 * it, set its avatar, switch it between public and private, invite people,
 * and browse its rooms and members.
 */
export function AppCommunitySettingsScreen() {
  const mx = useMatrixClient();
  const community = useCommunity();
  const isAdmin = useIsCommunityAdmin(community);
  const powerLevels = usePowerLevels(community);
  const creators = useRoomCreators(community);
  const permissions = useRoomPermissions(creators, powerLevels);
  const userId = mx.getSafeUserId();
  const canEdit = useCallback(
    (eventType: StateEvent) => permissions.stateEvent(eventType, userId),
    [permissions, userId]
  );

  return (
    <div className={css.Screen}>
      <header className={css.Header}>
        <BackToCommunity communityId={community.roomId} />
        <span className={css.HeaderTitle}>Community Settings</span>
      </header>
      {isAdmin ? (
        <div className={css.Body}>
          <ProfileSection community={community} canEdit={canEdit} />
          <VisibilitySection community={community} canEdit={canEdit} />
          <InviteSection community={community} canInvite={permissions.action('invite', userId)} />
          <RoomsSection community={community} />
          <MembersSection community={community} canRevoke={permissions.action('kick', userId)} />
        </div>
      ) : (
        <AppEmptyState
          title="Admins only"
          subtitle={`Only admins of ${community.name} can change its settings.`}
        />
      )}
    </div>
  );
}
