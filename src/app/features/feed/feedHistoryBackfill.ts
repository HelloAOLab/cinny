import { Direction, MatrixClient } from 'matrix-js-sdk';

export const FEED_HISTORY_TARGET_POST_COUNT = 25;
export const FEED_HISTORY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 1 month
export const FEED_HISTORY_PAGE_LIMIT = 80;

export type FeedRoomPaginationState = {
  loadedPostCount: number;
  targetPostCount: number;
  oldestLoadedEventTs: number | undefined;
  cutoffTs: number;
  paginationExhausted: boolean;
};

/**
 * Decides whether a feed room should fetch another page of history: stop once
 * enough posts have been found across all feed rooms combined, once this
 * room's oldest loaded event already predates the cutoff, or once the room's
 * history is exhausted (no pagination token left).
 */
export const shouldPaginateFeedRoom = (state: FeedRoomPaginationState): boolean => {
  if (state.paginationExhausted) return false;
  if (state.loadedPostCount >= state.targetPostCount) return false;
  if (state.oldestLoadedEventTs !== undefined && state.oldestLoadedEventTs < state.cutoffTs) {
    return false;
  }
  return true;
};

const getOldestLoadedTimeline = (mx: MatrixClient, roomId: string) => {
  const room = mx.getRoom(roomId);
  if (!room) return undefined;
  let timeline = room.getLiveTimeline();
  for (
    let next = timeline.getNeighbouringTimeline(Direction.Backward);
    next;
    next = timeline.getNeighbouringTimeline(Direction.Backward)
  ) {
    timeline = next;
  }
  return timeline;
};

const paginateFeedRoom = async (
  mx: MatrixClient,
  roomId: string,
  countLoadedPosts: () => number,
  targetPostCount: number,
  cutoffTs: number
): Promise<void> => {
  for (;;) {
    const timeline = getOldestLoadedTimeline(mx, roomId);
    if (!timeline) return;

    const canContinue = shouldPaginateFeedRoom({
      loadedPostCount: countLoadedPosts(),
      targetPostCount,
      oldestLoadedEventTs: timeline.getEvents()[0]?.getTs(),
      cutoffTs,
      paginationExhausted: timeline.getPaginationToken(Direction.Backward) === null,
    });
    if (!canContinue) return;

    // eslint-disable-next-line no-await-in-loop
    const hasMore = await mx.paginateEventTimeline(timeline, {
      backwards: true,
      limit: FEED_HISTORY_PAGE_LIMIT,
    });
    if (!hasMore) return;
  }
};

/**
 * Backfills history for each feed room in parallel until, across all of them
 * combined, at least `targetPostCount` feed posts are loaded, or each room's
 * history has been fetched back past `maxAgeMs`, or a room runs out of
 * history to paginate. The caller's own timeline listeners are expected to
 * pick up the newly-loaded events as they arrive (this only triggers the
 * fetch; it doesn't return the posts itself).
 */
export const backfillFeedHistory = async (
  mx: MatrixClient,
  roomIds: string[],
  countLoadedPosts: () => number,
  targetPostCount: number = FEED_HISTORY_TARGET_POST_COUNT,
  maxAgeMs: number = FEED_HISTORY_MAX_AGE_MS
): Promise<void> => {
  const cutoffTs = Date.now() - maxAgeMs;
  await Promise.allSettled(
    roomIds.map((roomId) =>
      paginateFeedRoom(mx, roomId, countLoadedPosts, targetPostCount, cutoffTs)
    )
  );
};
