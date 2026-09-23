import { describe, expect, it } from 'vitest';
import { Room } from 'matrix-js-sdk';
import { findPostsRoom, isPostsRoomName } from './findPostsRoom';

const room = (name: string): Room => ({ name } as Room);

describe('isPostsRoomName', () => {
  it('matches a name ending with -posts', () => {
    expect(isPostsRoomName('Village Updates-posts')).toBe(true);
  });

  it('matches regardless of case', () => {
    expect(isPostsRoomName('Village Updates-Posts')).toBe(true);
    expect(isPostsRoomName('Village Updates-POSTS')).toBe(true);
  });

  it('rejects a name that only contains the suffix mid-string', () => {
    expect(isPostsRoomName('village-posts-archive')).toBe(false);
  });

  it('rejects a name without the suffix', () => {
    expect(isPostsRoomName('General')).toBe(false);
  });

  it('rejects an undefined name', () => {
    expect(isPostsRoomName(undefined)).toBe(false);
  });
});

describe('findPostsRoom', () => {
  it('returns undefined when there are no children', () => {
    expect(findPostsRoom([], () => undefined)).toBeUndefined();
  });

  it('returns undefined when no child matches the suffix', () => {
    const rooms = new Map([
      ['!a:server', room('General')],
      ['!b:server', room('Announcements')],
    ]);
    expect(findPostsRoom([...rooms.keys()], (id) => rooms.get(id))).toBeUndefined();
  });

  it('returns the first matching child, preserving m.space.child order', () => {
    const rooms = new Map([
      ['!a:server', room('General')],
      ['!b:server', room('Prayer-posts')],
      ['!c:server', room('Praise-posts')],
    ]);
    const result = findPostsRoom([...rooms.keys()], (id) => rooms.get(id));
    expect(result?.name).toBe('Prayer-posts');
  });

  it('skips a matching child that has not been loaded yet', () => {
    const rooms = new Map([['!b:server', room('Praise-posts')]]);
    const result = findPostsRoom(
      ['!a:server', '!b:server'],
      (id) => rooms.get(id) // '!a:server' resolves to undefined
    );
    expect(result?.name).toBe('Praise-posts');
  });
});
