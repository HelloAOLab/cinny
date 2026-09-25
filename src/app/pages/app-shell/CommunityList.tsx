import React, { useCallback } from 'react';
import { MatrixError, Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { getMemberDisplayName, getRoomAvatarUrl } from '../../utils/room';
import { getMxIdLocalPart } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import { PlusIcon } from './AppIcons';
import * as css from './CommunitiesDrawer.css';

type CommunityListProps = {
  communities: Room[];
  currentCommunityId?: string;
  onSelect: (communityId: string) => void;
};

/** Joined communities as selectable rows, shared by the mobile drawer and desktop sidebar. */
export function CommunityList({ communities, currentCommunityId, onSelect }: CommunityListProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();

  if (communities.length === 0) {
    return <span className={css.EmptyList}>You haven&apos;t joined any communities yet.</span>;
  }

  return (
    <>
      {communities.map((room) => {
        const avatarUrl = getRoomAvatarUrl(mx, room, 96, useAuthentication);
        return (
          <button
            key={room.roomId}
            type="button"
            className={css.CommunityRow}
            aria-current={room.roomId === currentCommunityId}
            onClick={() => onSelect(room.roomId)}
          >
            <span className={css.CommunityAvatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={40} height={40} />
              ) : (
                nameInitials(room.name, 2)
              )}
            </span>
            <span className={css.CommunityName}>{room.name}</span>
          </button>
        );
      })}
    </>
  );
}

type CommunityInviteRowProps = {
  room: Room;
  onJoined: (communityId: string) => void;
};

function CommunityInviteRow({ room, onJoined }: CommunityInviteRowProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const avatarUrl = getRoomAvatarUrl(mx, room, 96, useAuthentication);
  const name = room.name || room.getCanonicalAlias() || room.roomId;

  const senderId = room.getMember(mx.getSafeUserId())?.events.member?.getSender();
  const senderName = senderId
    ? getMemberDisplayName(room, senderId) ?? getMxIdLocalPart(senderId) ?? senderId
    : undefined;

  const [joinState, join] = useAsyncCallback<void, MatrixError, []>(
    useCallback(async () => {
      await mx.joinRoom(room.roomId);
      onJoined(room.roomId);
    }, [mx, room, onJoined])
  );
  const [leaveState, leave] = useAsyncCallback<Record<string, never>, MatrixError, []>(
    useCallback(() => mx.leave(room.roomId), [mx, room])
  );

  const joining =
    joinState.status === AsyncStatus.Loading || joinState.status === AsyncStatus.Success;
  const leaving =
    leaveState.status === AsyncStatus.Loading || leaveState.status === AsyncStatus.Success;
  const error =
    (joinState.status === AsyncStatus.Error && joinState.error) ||
    (leaveState.status === AsyncStatus.Error && leaveState.error) ||
    undefined;

  return (
    <div className={css.InviteRow}>
      <div className={css.InviteInfo}>
        <span className={css.CommunityAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" width={40} height={40} />
          ) : (
            nameInitials(name, 2)
          )}
        </span>
        <span className={css.InviteText}>
          <span className={css.CommunityName}>{name}</span>
          {senderName && <span className={css.InviteSender}>Invited by {senderName}</span>}
        </span>
      </div>
      {error && <span className={css.InviteError}>{error.message}</span>}
      <div className={css.InviteActions}>
        <button
          type="button"
          className={css.DeclineButton}
          disabled={joining || leaving}
          onClick={leave}
        >
          {leaving ? 'Declining…' : 'Decline'}
        </button>
        <button
          type="button"
          className={css.JoinButton}
          disabled={joining || leaving}
          onClick={join}
        >
          {joining ? 'Joining…' : 'Join'}
        </button>
      </div>
    </div>
  );
}

type CommunityInviteListProps = {
  invites: Room[];
  /** Called once a community invite has been accepted. */
  onJoined: (communityId: string) => void;
};

/** Communities the user has been invited to, each with Join and Decline actions. */
export function CommunityInviteList({ invites, onJoined }: CommunityInviteListProps) {
  return (
    <>
      {invites.map((room) => (
        <CommunityInviteRow key={room.roomId} room={room} onJoined={onJoined} />
      ))}
    </>
  );
}

type CommunitySectionsProps = CommunityListProps & {
  invites: Room[];
  onJoined: (communityId: string) => void;
};

/**
 * Pending community invites followed by joined communities. The section headings only appear when there are invites, so the joined
 * list looks unchanged otherwise.
 */
export function CommunitySections({
  invites,
  onJoined,
  communities,
  currentCommunityId,
  onSelect,
}: CommunitySectionsProps) {
  const list = (
    <CommunityList
      communities={communities}
      currentCommunityId={currentCommunityId}
      onSelect={onSelect}
    />
  );
  if (invites.length === 0) return list;

  return (
    <>
      <span className={css.ListHeading}>Invitations</span>
      <CommunityInviteList invites={invites} onJoined={onJoined} />
      <span className={css.ListHeading}>Joined</span>
      {list}
    </>
  );
}

export function CreateCommunityButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={css.CreateButton} onClick={onClick}>
      <span className={css.CreateIcon}>
        <PlusIcon />
      </span>
      <span className={css.CommunityName}>Create community</span>
    </button>
  );
}
