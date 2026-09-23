import { describe, expect, it } from 'vitest';
import { MatrixEvent } from 'matrix-js-sdk';
import { AMEN_REACTION_KEY, summarizePostReactions } from './postReactions';

const reaction = (sender: string): MatrixEvent => ({ getSender: () => sender } as MatrixEvent);

describe('summarizePostReactions', () => {
  it('returns nothing when there are no reactions', () => {
    expect(summarizePostReactions([], '@me:example.org')).toEqual([]);
  });

  it('counts each key and flags keys the current user reacted with', () => {
    const result = summarizePostReactions(
      [
        ['👍', new Set([reaction('@a:example.org'), reaction('@me:example.org')])],
        ['🎉', new Set([reaction('@b:example.org')])],
      ],
      '@me:example.org'
    );
    expect(result).toEqual([
      { key: '👍', count: 2, mine: true },
      { key: '🎉', count: 1, mine: false },
    ]);
  });

  it('moves the Amen key to the front', () => {
    const result = summarizePostReactions(
      [
        ['👍', new Set([reaction('@a:example.org'), reaction('@b:example.org')])],
        [AMEN_REACTION_KEY, new Set([reaction('@c:example.org')])],
      ],
      '@me:example.org'
    );
    expect(result.map((summary) => summary.key)).toEqual([AMEN_REACTION_KEY, '👍']);
  });

  it('drops keys with no remaining reactions', () => {
    expect(summarizePostReactions([['👍', new Set()]], '@me:example.org')).toEqual([]);
  });

  it('never flags reactions as mine without a user id', () => {
    const result = summarizePostReactions([['👍', new Set([reaction('@a:example.org')])]], null);
    expect(result[0].mine).toBe(false);
  });
});
