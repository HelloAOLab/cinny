import { useEffect, useMemo, useState } from 'react';
import {
  Direction,
  EventTimeline,
  MatrixEvent,
  RelationType,
  Room,
  RoomEvent,
} from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { MessageEvent } from '../../../types/matrix/room';
import { backfillFeedHistory } from './feedHistoryBackfill';

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

// Backfilled history lives in EventTimeline segments linked behind the live
// timeline (matrix-js-sdk doesn't merge them into it), so every linked
// timeline has to be walked to see posts that were just paginated in.
const collectLinkedTimelines = (room: Room): EventTimeline[] => {
  const timelines: EventTimeline[] = [];
  let timeline: EventTimeline | null = room.getLiveTimeline();
  while (timeline) {
    timelines.push(timeline);
    timeline = timeline.getNeighbouringTimeline(Direction.Backward);
  }
  return timelines;
};

const collectRoomFeedPosts = (room: Room): MatrixEvent[] =>
  collectLinkedTimelines(room).flatMap((timeline) => timeline.getEvents().filter(isFeedPostEvent));

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

  // A post's room may not have been opened yet, so its events might not be
  // loaded beyond whatever the initial sync happened to backfill. Paginate
  // each feed room's history until there are enough posts to show or the
  // history is too old to bother with; the listeners above pick up whatever
  // this loads in as ordinary timeline events.
  useEffect(() => {
    const countLoadedPosts = () =>
      roomIds.reduce((count, roomId) => {
        const room = mx.getRoom(roomId);
        return room ? count + collectRoomFeedPosts(room).length : count;
      }, 0);

    backfillFeedHistory(mx, roomIds, countLoadedPosts).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mx, roomIds.join(',')]);

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
