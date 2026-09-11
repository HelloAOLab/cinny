import { useCallback } from 'react';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { eventWithShortcode, factoryEventSentBy } from '../utils/matrix';
import { getEventReactions, getReactionContent } from '../utils/room';
import { MessageEvent } from '../../types/matrix/room';

export type ReactionToggleHandler = (
  targetEventId: string,
  key: string,
  shortcode?: string
) => void;

export const useReactionToggle = (room: Room): ReactionToggleHandler => {
  const mx = useMatrixClient();

  return useCallback(
    (targetEventId, key, shortcode) => {
      const relations = getEventReactions(room.getUnfilteredTimelineSet(), targetEventId);
      const allReactions = relations?.getSortedAnnotationsByKey() ?? [];
      const [, reactionsSet] = allReactions.find(([k]) => k === key) ?? [];
      const reactions = reactionsSet ? Array.from(reactionsSet) : [];
      const myReaction = reactions.find(factoryEventSentBy(mx.getUserId()!));

      if (myReaction && myReaction.isRelation()) {
        mx.redactEvent(room.roomId, myReaction.getId()!);
        return;
      }
      const rShortcode =
        shortcode ||
        (reactions.find(eventWithShortcode)?.getContent().shortcode as string | undefined);
      mx.sendEvent(
        room.roomId,
        MessageEvent.Reaction as any,
        getReactionContent(targetEventId, key, rShortcode)
      );
    },
    [mx, room]
  );
};
