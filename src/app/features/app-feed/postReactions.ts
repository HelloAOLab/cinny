import { MatrixEvent } from 'matrix-js-sdk';

/** Reaction key sent by a post's "Amen" button. */
export const AMEN_REACTION_KEY = '🙏';

export type PostReactionSummary = {
  key: string;
  count: number;
  /** True when the current user is one of the senders of this key. */
  mine: boolean;
};

/**
 * Turns matrix-js-sdk's `getSortedAnnotationsByKey()` output into per-key
 * chips for a post card: empty keys are dropped, the Amen key always comes
 * first (it's the post's primary reaction), and the rest keep the SDK's
 * most-reacted-first order.
 */
export const summarizePostReactions = (
  annotations: [string, Set<MatrixEvent>][],
  userId: string | null | undefined
): PostReactionSummary[] => {
  const summaries = annotations
    .map(([key, events]) => {
      const senders = Array.from(events).map((event) => event.getSender());
      return {
        key,
        count: events.size,
        mine: !!userId && senders.includes(userId),
      };
    })
    .filter((summary) => summary.count > 0);

  const amen = summaries.filter((summary) => summary.key === AMEN_REACTION_KEY);
  const rest = summaries.filter((summary) => summary.key !== AMEN_REACTION_KEY);
  return [...amen, ...rest];
};
