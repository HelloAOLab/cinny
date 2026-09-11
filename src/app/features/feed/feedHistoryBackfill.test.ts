import { describe, expect, it } from 'vitest';
import { shouldPaginateFeedRoom, FeedRoomPaginationState } from './feedHistoryBackfill';

const baseState: FeedRoomPaginationState = {
  loadedPostCount: 0,
  targetPostCount: 25,
  oldestLoadedEventTs: undefined,
  cutoffTs: 1000,
  paginationExhausted: false,
};

describe('shouldPaginateFeedRoom', () => {
  it('continues when below target, within the cutoff, and history remains', () => {
    expect(shouldPaginateFeedRoom(baseState)).toBe(true);
  });

  it('stops once enough posts are loaded across all feed rooms', () => {
    expect(shouldPaginateFeedRoom({ ...baseState, loadedPostCount: 25 })).toBe(false);
    expect(shouldPaginateFeedRoom({ ...baseState, loadedPostCount: 30 })).toBe(false);
  });

  it('stops once the oldest loaded event already predates the cutoff', () => {
    expect(shouldPaginateFeedRoom({ ...baseState, oldestLoadedEventTs: 999 })).toBe(false);
  });

  it('keeps going while the oldest loaded event is still within the cutoff', () => {
    expect(shouldPaginateFeedRoom({ ...baseState, oldestLoadedEventTs: 1000 })).toBe(true);
    expect(shouldPaginateFeedRoom({ ...baseState, oldestLoadedEventTs: 1500 })).toBe(true);
  });

  it('stops once a room has no more history to paginate', () => {
    expect(shouldPaginateFeedRoom({ ...baseState, paginationExhausted: true })).toBe(false);
  });

  it('has no cutoff to apply before any history has been loaded yet', () => {
    expect(shouldPaginateFeedRoom({ ...baseState, oldestLoadedEventTs: undefined })).toBe(true);
  });

  it('checks exhaustion before the post-count target', () => {
    expect(
      shouldPaginateFeedRoom({ ...baseState, loadedPostCount: 30, paginationExhausted: true })
    ).toBe(false);
  });
});
