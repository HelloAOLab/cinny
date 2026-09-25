import { describe, expect, it } from 'vitest';
import { RoomToParents } from '../../../types/matrix/room';
import { groupAppSearchResults, splitHighlights } from './appSearchResults';

const roomToParents: RoomToParents = new Map([
  ['!church-posts:x', new Set(['!church:x'])],
  ['!general:x', new Set(['!church:x'])],
  ['!school-posts:x', new Set(['!school:x'])],
  ['!class:x', new Set(['!school:x'])],
  ['!shared:x', new Set(['!church:x', '!school:x'])],
]);
const communityIds = ['!church:x', '!school:x'];
const isPostsRoom = (roomId: string) => roomId.endsWith('-posts:x');

type Item = { id: string; roomId: string };
const item = (id: string, roomId: string): Item => ({ id, roomId });
const group = (items: Item[], preferredCommunityId?: string) =>
  groupAppSearchResults(
    items,
    (i) => i.roomId,
    communityIds,
    roomToParents,
    isPostsRoom,
    preferredCommunityId
  );
const ids = (items: Item[]) => items.map((i) => i.id);

describe('groupAppSearchResults', () => {
  it('groups matches by community, splitting posts from chats', () => {
    const result = group([
      item('a', '!general:x'),
      item('b', '!church-posts:x'),
      item('c', '!class:x'),
      item('d', '!church-posts:x'),
      item('e', '!school-posts:x'),
    ]);

    expect(result.communities.map((g) => g.communityId)).toEqual(['!church:x', '!school:x']);
    expect(ids(result.communities[0].posts)).toEqual(['b', 'd']);
    expect(ids(result.communities[0].chats)).toEqual(['a']);
    expect(ids(result.communities[1].posts)).toEqual(['e']);
    expect(ids(result.communities[1].chats)).toEqual(['c']);
    expect(result.otherChats).toEqual([]);
  });

  it('puts rooms outside every community into other chats', () => {
    const result = group([item('a', '!dm:x'), item('b', '!general:x')]);

    expect(ids(result.otherChats)).toEqual(['a']);
    expect(result.communities.map((g) => g.communityId)).toEqual(['!church:x']);
  });

  it('lists the open community first', () => {
    const result = group([item('a', '!general:x'), item('b', '!class:x')], '!school:x');

    expect(result.communities.map((g) => g.communityId)).toEqual(['!school:x', '!church:x']);
  });

  it('files a room in several communities under the open one', () => {
    const result = group([item('a', '!shared:x')], '!school:x');

    expect(result.communities).toEqual([
      { communityId: '!school:x', posts: [], chats: [item('a', '!shared:x')] },
    ]);
  });

  it('returns no groups without matches', () => {
    expect(group([])).toEqual({ communities: [], otherChats: [] });
  });
});

describe('splitHighlights', () => {
  it('marks case-insensitive matches', () => {
    expect(splitHighlights('Pray for Sam, please pray', ['pray'])).toEqual([
      { text: 'Pray', match: true },
      { text: ' for Sam, please ', match: false },
      { text: 'pray', match: true },
    ]);
  });

  it('prefers the longer of overlapping terms', () => {
    expect(splitHighlights('praying now', ['pray', 'praying'])).toEqual([
      { text: 'praying', match: true },
      { text: ' now', match: false },
    ]);
  });

  it('escapes regex characters in terms', () => {
    expect(splitHighlights('a (b) c', ['(b)'])).toEqual([
      { text: 'a ', match: false },
      { text: '(b)', match: true },
      { text: ' c', match: false },
    ]);
  });

  it('returns the text unmarked without highlights', () => {
    expect(splitHighlights('hello', [])).toEqual([{ text: 'hello', match: false }]);
    expect(splitHighlights('', ['x'])).toEqual([]);
  });
});
