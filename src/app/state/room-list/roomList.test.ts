import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';
import { allRoomsAtom } from './roomList';

describe('allRoomsAtom reducer', () => {
  it('INITIALIZE replaces the whole room list', () => {
    const store = createStore();
    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!a:x', '!b:x'] });
    expect(store.get(allRoomsAtom)).toEqual(['!a:x', '!b:x']);

    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!c:x'] });
    expect(store.get(allRoomsAtom)).toEqual(['!c:x']);
  });

  it('PUT appends a new room id', () => {
    const store = createStore();
    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!a:x'] });
    store.set(allRoomsAtom, { type: 'PUT', roomId: '!b:x' });
    expect(store.get(allRoomsAtom)).toEqual(['!a:x', '!b:x']);
  });

  it('PUT on an existing room id moves it to the end instead of duplicating it', () => {
    const store = createStore();
    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!a:x', '!b:x', '!c:x'] });
    store.set(allRoomsAtom, { type: 'PUT', roomId: '!a:x' });
    expect(store.get(allRoomsAtom)).toEqual(['!b:x', '!c:x', '!a:x']);
  });

  it('DELETE removes a room id', () => {
    const store = createStore();
    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!a:x', '!b:x'] });
    store.set(allRoomsAtom, { type: 'DELETE', roomId: '!a:x' });
    expect(store.get(allRoomsAtom)).toEqual(['!b:x']);
  });

  it('DELETE of a non-existent room id is a no-op', () => {
    const store = createStore();
    store.set(allRoomsAtom, { type: 'INITIALIZE', rooms: ['!a:x'] });
    store.set(allRoomsAtom, { type: 'DELETE', roomId: '!missing:x' });
    expect(store.get(allRoomsAtom)).toEqual(['!a:x']);
  });
});
