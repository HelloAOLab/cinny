import { Room } from 'matrix-js-sdk';
import { FeedPost } from './useFeedPosts';

export type FeedPostGroup = {
  room: Room;
  posts: FeedPost[];
};

// Mirrors the room timeline's threshold for visually collapsing consecutive
// messages from the same sender (RoomTimeline.tsx's `collapsed` check).
export const FEED_GROUP_WINDOW_MS = 2 * 60 * 1000;

type GroupKey = {
  roomId: string;
  senderId: string | null;
  ts: number;
};

/**
 * Groups adjacent items sharing the same room/sender within `windowMs` of each
 * other. `items` must be sorted newest-first (as useFeedPosts returns them) so
 * that adjacency in the array reflects adjacency in time. Each returned group
 * is reordered oldest-first for natural reading order.
 */
export const groupAdjacentBy = <T>(
  items: T[],
  toKey: (item: T) => GroupKey,
  windowMs: number = FEED_GROUP_WINDOW_MS
): T[][] => {
  const groups: T[][] = [];
  let prevKey: GroupKey | undefined;

  items.forEach((item) => {
    const key = toKey(item);
    const lastGroup = groups[groups.length - 1];
    const groupable =
      prevKey !== undefined &&
      key.senderId !== null &&
      prevKey.roomId === key.roomId &&
      prevKey.senderId === key.senderId &&
      Math.abs(prevKey.ts - key.ts) < windowMs;

    if (lastGroup && groupable) {
      lastGroup.unshift(item);
    } else {
      groups.push([item]);
    }
    prevKey = key;
  });

  return groups;
};

export const groupFeedPosts = (
  posts: FeedPost[],
  windowMs: number = FEED_GROUP_WINDOW_MS
): FeedPostGroup[] =>
  groupAdjacentBy(
    posts,
    (post) => ({
      roomId: post.room.roomId,
      senderId: post.event.getSender() ?? null,
      ts: post.event.getTs(),
    }),
    windowMs
  ).map((groupPosts) => ({ room: groupPosts[0].room, posts: groupPosts }));
