import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { MatrixClient, MatrixError, Room, RoomEvent, RoomEventHandlerMap } from 'matrix-js-sdk';
import { useQuery } from '@tanstack/react-query';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useRoomLatestRenderedEvent } from '../../hooks/useRoomLatestRenderedEvent';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useRecursiveChildScopeFactory, useSpaceChildren } from '../../state/hooks/roomList';
import { useRoomUnread } from '../../state/hooks/unread';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { getMemberDisplayName, getRoomAvatarUrl, getStateEvent } from '../../utils/room';
import { getMxIdServer, mxcUrlToHttp } from '../../utils/matrix';
import { StateEvent } from '../../../types/matrix/room';
import { factoryRoomIdByActivity } from '../../utils/sort';
import { nameInitials } from '../../utils/common';
import { relativeTime } from '../../utils/time';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { getAppCommunityChatRoomPath } from '../../pages/pathUtils';
import {
  ResolvedChatRoom,
  RoomReplacement,
  UnjoinedChatRoom,
  getMessagePreview,
  getUnjoinedChatRooms,
  resolveReplacedRooms,
} from './chatRooms';
import * as css from './AppChat.css';

const HIERARCHY_LIMIT = 100;

/**
 * Re-renders whenever a live timeline event arrives in one of `roomIds`, so
 * the activity-sorted list stays in order as new messages come in.
 */
const useRoomsActivityTick = (roomIds: string[]): number => {
  const mx = useMatrixClient();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const roomIdSet = new Set(roomIds);
    const handleTimeline: RoomEventHandlerMap[RoomEvent.Timeline] = (
      mEvent,
      room,
      toStartOfTimeline,
      removed,
      data
    ) => {
      if (!room || !roomIdSet.has(room.roomId) || toStartOfTimeline || !data.liveEvent) return;
      setTick((t) => t + 1);
    };
    mx.on(RoomEvent.Timeline, handleTimeline);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleTimeline);
    };
  }, [mx, roomIds]);

  return tick;
};

/** The room that replaced `roomId`, read from its m.room.tombstone state (if it's in the store). */
const getRoomReplacement = (mx: MatrixClient, roomId: string): RoomReplacement | undefined => {
  const room = mx.getRoom(roomId);
  const tombstone = room ? getStateEvent(room, StateEvent.RoomTombstone) : undefined;
  const replacementRoomId: unknown = tombstone?.getContent().replacement_room;
  if (!tombstone || typeof replacementRoomId !== 'string' || !replacementRoomId) return undefined;
  const server = getMxIdServer(tombstone.getSender() ?? '');
  return { roomId: replacementRoomId, via: server ? [server] : [] };
};

type ChatRoomItemProps = {
  room: Room;
  communityId: string;
  selected?: boolean;
};

function ChatRoomItem({ room, communityId, selected }: ChatRoomItemProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const latestEvent = useRoomLatestRenderedEvent(room);
  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);

  const avatarUrl = getRoomAvatarUrl(mx, room, 96, useAuthentication);
  const preview = latestEvent
    ? getMessagePreview({ type: latestEvent.getType(), content: latestEvent.getContent() })
    : undefined;
  const senderId = latestEvent?.getSender();
  const senderName =
    senderId &&
    (senderId === mx.getUserId()
      ? 'You'
      : getMemberDisplayName(room, senderId) ?? senderId.split(':')[0]);
  const lastActive = room.getLastActiveTimestamp();
  const hasUnread = !!unread && unread.total > 0;

  return (
    <Link
      to={getAppCommunityChatRoomPath(communityId, room.roomId)}
      className={`${css.RoomItem} ${selected ? css.RoomItemSelected : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      <span className={css.Avatar}>
        {avatarUrl ? (
          <img className={css.AvatarImage} src={avatarUrl} alt="" />
        ) : (
          nameInitials(room.name, 2)
        )}
      </span>
      <span className={css.RoomText}>
        <span className={css.RoomNameRow}>
          <span className={`${css.RoomName} ${hasUnread ? css.RoomNameUnread : ''}`}>
            {room.name}
          </span>
          {lastActive > 0 && (
            <span className={css.Time}>{relativeTime(lastActive, Date.now(), 'narrow')}</span>
          )}
        </span>
        <span className={css.PreviewRow}>
          <span className={`${css.Preview} ${hasUnread ? css.PreviewUnread : ''}`}>
            {preview ? `${senderName ? `${senderName}: ` : ''}${preview}` : 'No messages yet'}
          </span>
          {hasUnread && (
            <span className={`${css.Badge} ${unread.highlight > 0 ? css.BadgeHighlight : ''}`}>
              {unread.total > 99 ? '99+' : unread.total}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

type UnjoinedChatRoomItemProps = {
  room: UnjoinedChatRoom;
};

function UnjoinedChatRoomItem({ room }: UnjoinedChatRoomItemProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [joinState, join] = useAsyncCallback<Room, MatrixError, []>(
    React.useCallback(
      () => mx.joinRoom(room.roomId, { viaServers: room.via }),
      [mx, room.roomId, room.via]
    )
  );

  const avatarUrl = room.avatarUrl
    ? mxcUrlToHttp(mx, room.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;
  const joining =
    joinState.status === AsyncStatus.Loading || joinState.status === AsyncStatus.Success;

  return (
    <div className={css.RoomItem}>
      <span className={css.Avatar}>
        {avatarUrl ? (
          <img className={css.AvatarImage} src={avatarUrl} alt="" />
        ) : (
          nameInitials(room.name, 2)
        )}
      </span>
      <span className={css.RoomText}>
        <span className={css.RoomName}>{room.name}</span>
        {joinState.status === AsyncStatus.Error ? (
          <span className={css.JoinError}>{joinState.error.message || 'Failed to join'}</span>
        ) : (
          <span className={css.Preview}>
            {room.topic || `${room.memberCount} ${room.memberCount === 1 ? 'member' : 'members'}`}
          </span>
        )}
      </span>
      <button type="button" className={css.JoinButton} disabled={joining} onClick={() => join()}>
        {joining ? 'Joining…' : 'Join'}
      </button>
    </div>
  );
}

type ChatListItem =
  | { entry: ResolvedChatRoom; room: Room; unjoined?: undefined }
  | { entry: ResolvedChatRoom; room?: undefined; unjoined: UnjoinedChatRoom };

type AppChatRoomListProps = {
  /** Room open next to the list in the desktop split view. */
  selectedRoomId?: string;
};

/** The community's joined rooms (by activity) followed by rooms that can still be joined. */
export function AppChatRoomList({ selectedRoomId }: AppChatRoomListProps) {
  const mx = useMatrixClient();
  const community = useCommunity();
  const allRooms = useAtomValue(allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);

  const roomIds = useSpaceChildren(
    allRoomsAtom,
    community.roomId,
    useRecursiveChildScopeFactory(mx, roomToParents)
  );
  const activityTick = useRoomsActivityTick(roomIds);
  // Replaced (upgraded) rooms are swapped for the room that replaced them. A
  // tombstone arrives as a live timeline event, so activityTick also covers it.
  const resolvedRooms = useMemo(
    () =>
      resolveReplacedRooms(
        [...roomIds].sort(factoryRoomIdByActivity(mx)),
        (roomId) => getRoomReplacement(mx, roomId),
        (roomId) => allRooms.includes(roomId)
      ),
    // activityTick re-sorts the list when new messages arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mx, roomIds, allRooms, activityTick]
  );
  const rooms = useMemo(
    () =>
      resolvedRooms.reduce<ChatListItem[]>((items, entry) => {
        if (entry.kind === 'joined') {
          const room = mx.getRoom(entry.roomId);
          if (room) items.push({ entry, room });
          return items;
        }
        const latestRoom = mx.getRoom(entry.latestJoinedId);
        if (latestRoom) {
          items.push({
            entry,
            unjoined: {
              roomId: entry.roomId,
              name: latestRoom.name,
              topic: 'This room has been replaced. Join the new room to continue.',
              avatarUrl: latestRoom.getMxcAvatarUrl() ?? undefined,
              memberCount: 0,
              via: entry.via,
            },
          });
        }
        return items;
      }, []),
    [mx, resolvedRooms]
  );
  const shownRoomIds = useMemo(() => {
    const ids = new Set<string>();
    resolvedRooms.forEach((entry) => {
      ids.add(entry.roomId);
      entry.predecessorIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [resolvedRooms]);

  const { data: hierarchy } = useQuery({
    queryKey: [community.roomId, 'app-chat-hierarchy'],
    queryFn: () => mx.getRoomHierarchy(community.roomId, HIERARCHY_LIMIT),
    staleTime: 60 * 1000,
  });
  const unjoinedRooms = useMemo(
    () =>
      hierarchy
        ? getUnjoinedChatRooms(
            community.roomId,
            hierarchy.rooms,
            (roomId) => allRooms.includes(roomId) || shownRoomIds.has(roomId)
          ).filter((room) => !getRoomReplacement(mx, room.roomId))
        : [],
    [mx, hierarchy, community.roomId, allRooms, shownRoomIds]
  );

  if (rooms.length === 0 && unjoinedRooms.length === 0) {
    return (
      <AppEmptyState
        title="No chat rooms yet"
        subtitle={`Rooms in ${community.name} will show up here.`}
      />
    );
  }

  return (
    <>
      {rooms.length > 0 && (
        <section className={css.Section}>
          <span className={css.SectionTitle}>Your rooms</span>
          {rooms.map(({ entry, room, unjoined }) =>
            room ? (
              <ChatRoomItem
                key={entry.roomId}
                room={room}
                communityId={community.roomId}
                selected={
                  !!selectedRoomId &&
                  (entry.roomId === selectedRoomId || entry.predecessorIds.includes(selectedRoomId))
                }
              />
            ) : (
              <UnjoinedChatRoomItem key={entry.roomId} room={unjoined} />
            )
          )}
        </section>
      )}
      {unjoinedRooms.length > 0 && (
        <section className={css.Section}>
          <span className={css.SectionTitle}>More rooms in {community.name}</span>
          {unjoinedRooms.map((room) => (
            <UnjoinedChatRoomItem key={room.roomId} room={room} />
          ))}
        </section>
      )}
    </>
  );
}
