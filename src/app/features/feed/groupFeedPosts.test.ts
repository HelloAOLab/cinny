import { describe, expect, it } from 'vitest';
import { groupAdjacentBy, groupFeedPosts, FEED_GROUP_WINDOW_MS } from './groupFeedPosts';
import { FeedPost } from './useFeedPosts';

type Item = { id: string; roomId: string; senderId: string | null; ts: number };
const toKey = (item: Item) => item;

describe('groupAdjacentBy', () => {
  it('groups consecutive same-room same-sender items within the time window, oldest first', () => {
    const items: Item[] = [
      { id: 'c', roomId: 'r1', senderId: 'u1', ts: 3000 },
      { id: 'b', roomId: 'r1', senderId: 'u1', ts: 2000 },
      { id: 'a', roomId: 'r1', senderId: 'u1', ts: 1000 },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not group items from different rooms', () => {
    const items: Item[] = [
      { id: 'a', roomId: 'r1', senderId: 'u1', ts: 1000 },
      { id: 'b', roomId: 'r2', senderId: 'u1', ts: 1500 },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups.map((g) => g.map((i) => i.id))).toEqual([['a'], ['b']]);
  });

  it('does not group items from different senders', () => {
    const items: Item[] = [
      { id: 'a', roomId: 'r1', senderId: 'u1', ts: 1000 },
      { id: 'b', roomId: 'r1', senderId: 'u2', ts: 1500 },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups.map((g) => g.map((i) => i.id))).toEqual([['a'], ['b']]);
  });

  it('does not group items further apart than the window', () => {
    const items: Item[] = [
      { id: 'a', roomId: 'r1', senderId: 'u1', ts: 0 },
      { id: 'b', roomId: 'r1', senderId: 'u1', ts: FEED_GROUP_WINDOW_MS },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups.map((g) => g.map((i) => i.id))).toEqual([['a'], ['b']]);
  });

  it('does not group posts from an unknown sender with each other', () => {
    const items: Item[] = [
      { id: 'a', roomId: 'r1', senderId: null, ts: 1000 },
      { id: 'b', roomId: 'r1', senderId: null, ts: 1500 },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups.map((g) => g.map((i) => i.id))).toEqual([['a'], ['b']]);
  });

  it('only groups items adjacent in the input, not merely sharing room/sender', () => {
    const items: Item[] = [
      { id: 'a', roomId: 'r1', senderId: 'u1', ts: 3000 },
      { id: 'b', roomId: 'r1', senderId: 'u2', ts: 2000 },
      { id: 'c', roomId: 'r1', senderId: 'u1', ts: 1000 },
    ];
    const groups = groupAdjacentBy(items, toKey);
    expect(groups.map((g) => g.map((i) => i.id))).toEqual([['a'], ['b'], ['c']]);
  });
});

const fakePost = (id: string, roomId: string, senderId: string, ts: number): FeedPost =>
  ({
    room: { roomId } as FeedPost['room'],
    event: {
      getId: () => id,
      getSender: () => senderId,
      getTs: () => ts,
    } as unknown as FeedPost['event'],
  } as FeedPost);

describe('groupFeedPosts', () => {
  it('groups feed posts by room and sender, reordered oldest first', () => {
    // useFeedPosts sorts newest-first, so groupFeedPosts receives them in that order.
    const posts = [
      fakePost('caption', '!room:x', '@alice:x', 2500),
      fakePost('img', '!room:x', '@alice:x', 2000),
    ];
    const groups = groupFeedPosts(posts);
    expect(groups).toHaveLength(1);
    expect(groups[0].room.roomId).toBe('!room:x');
    expect(groups[0].posts.map((p) => p.event.getId())).toEqual(['img', 'caption']);
  });

  it('keeps posts from different rooms in separate groups', () => {
    const posts = [
      fakePost('a', '!room1:x', '@alice:x', 1000),
      fakePost('b', '!room2:x', '@alice:x', 1500),
    ];
    const groups = groupFeedPosts(posts);
    expect(groups).toHaveLength(2);
  });
});
