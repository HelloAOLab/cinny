import { describe, expect, it } from 'vitest';
import { RoomToParents } from '../../types/matrix/room';
import { getAllParents, mapParentWithChildren } from './room';

describe('getAllParents', () => {
  it('returns an empty set for a room with no parents', () => {
    const roomToParents: RoomToParents = new Map();
    expect(getAllParents(roomToParents, '!room:x')).toEqual(new Set());
  });

  it('returns the direct parent of a room', () => {
    const roomToParents: RoomToParents = new Map([['!room:x', new Set(['!space:x'])]]);
    expect(getAllParents(roomToParents, '!room:x')).toEqual(new Set(['!space:x']));
  });

  it('resolves ancestors through nested sub-spaces', () => {
    // !room:x -> !subspace:x -> !space:x
    const roomToParents: RoomToParents = new Map([
      ['!room:x', new Set(['!subspace:x'])],
      ['!subspace:x', new Set(['!space:x'])],
    ]);
    expect(getAllParents(roomToParents, '!room:x')).toEqual(new Set(['!subspace:x', '!space:x']));
  });

  it('collects all ancestors when a room has multiple parents', () => {
    const roomToParents: RoomToParents = new Map([
      ['!room:x', new Set(['!spaceA:x', '!spaceB:x'])],
    ]);
    expect(getAllParents(roomToParents, '!room:x')).toEqual(new Set(['!spaceA:x', '!spaceB:x']));
  });

  it('never includes the room itself, even in a cyclic map', () => {
    const roomToParents: RoomToParents = new Map([
      ['!room:x', new Set(['!space:x'])],
      ['!space:x', new Set(['!room:x'])],
    ]);
    expect(getAllParents(roomToParents, '!room:x')).toEqual(new Set(['!space:x']));
  });
});

describe('mapParentWithChildren', () => {
  it('maps each child to its parent room', () => {
    const roomToParents: RoomToParents = new Map();
    mapParentWithChildren(roomToParents, '!space:x', ['!room1:x', '!room2:x']);

    expect(roomToParents.get('!room1:x')).toEqual(new Set(['!space:x']));
    expect(roomToParents.get('!room2:x')).toEqual(new Set(['!space:x']));
  });

  it('adds an additional parent without dropping an existing one', () => {
    const roomToParents: RoomToParents = new Map([['!room:x', new Set(['!spaceA:x'])]]);
    mapParentWithChildren(roomToParents, '!spaceB:x', ['!room:x']);

    expect(roomToParents.get('!room:x')).toEqual(new Set(['!spaceA:x', '!spaceB:x']));
  });

  it('skips a child that would create a space cycle', () => {
    // !space:x is already a (transitive) child of !subspace:x, so making
    // !subspace:x a child of !space:x would form a cycle.
    const roomToParents: RoomToParents = new Map([['!space:x', new Set(['!subspace:x'])]]);
    mapParentWithChildren(roomToParents, '!space:x', ['!subspace:x']);

    expect(roomToParents.get('!subspace:x')).toBeUndefined();
  });
});
