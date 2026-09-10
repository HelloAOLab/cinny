import { useEffect, useMemo, useState } from 'react';
import { MatrixEvent, RelationType, Room, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { MessageEvent } from '../../../types/matrix/room';

export type FeedPost = {
  room: Room;
  event: MatrixEvent;
};

const isFeedPostEvent = (event: MatrixEvent): boolean => {
  if (event.getType() !== MessageEvent.RoomMessage) return false;
  if (event.isRedacted()) return false;

  const content = event.getContent();
  if (content['m.post'] !== true) return false;

  const relation = content['m.relates_to'] as { rel_type?: string } | undefined;
  if (relation?.rel_type === RelationType.Replace) return false;

  return true;
};

const collectRoomFeedPosts = (room: Room): MatrixEvent[] =>
  room.getLiveTimeline().getEvents().filter(isFeedPostEvent);

export const useFeedPosts = (roomIds: string[]): FeedPost[] => {
  const mx = useMatrixClient();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    mx.on(RoomEvent.Timeline, handleUpdate);
    mx.on(RoomEvent.TimelineReset, handleUpdate);
    mx.on(RoomEvent.Redaction, handleUpdate);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleUpdate);
      mx.removeListener(RoomEvent.TimelineReset, handleUpdate);
      mx.removeListener(RoomEvent.Redaction, handleUpdate);
    };
  }, [mx]);

  const posts = useMemo(() => {
    const items: FeedPost[] = [];
    roomIds.forEach((roomId) => {
      const room = mx.getRoom(roomId);
      if (!room) return;
      collectRoomFeedPosts(room).forEach((event) => {
        items.push({ room, event });
      });
    });
    items.sort((a, b) => b.event.getTs() - a.event.getTs());
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mx, roomIds, tick]);

  return posts;
};
