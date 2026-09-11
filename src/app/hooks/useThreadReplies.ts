import { useEffect, useMemo, useState } from 'react';
import { MatrixEvent, RelationType, Room, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { getEventThreadReplies } from '../utils/room';
import { MessageEvent } from '../../types/matrix/room';

/**
 * Combines two sources: an explicit `/relations` server fetch (so replies
 * that predate this session's locally loaded timeline, e.g. from before a
 * page refresh, are not lost) and the client's locally aggregated relations
 * (so newly sent/received replies, including local echo, show up live
 * without waiting on a round trip).
 */
export const useThreadReplies = (room: Room, eventId: string | undefined): MatrixEvent[] => {
  const mx = useMatrixClient();
  const [tick, setTick] = useState(0);
  const [fetchedReplies, setFetchedReplies] = useState<MatrixEvent[]>([]);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    mx.on(RoomEvent.Timeline, handleUpdate);
    mx.on(RoomEvent.TimelineReset, handleUpdate);
    mx.on(RoomEvent.Redaction, handleUpdate);
    mx.on(RoomEvent.LocalEchoUpdated, handleUpdate);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleUpdate);
      mx.removeListener(RoomEvent.TimelineReset, handleUpdate);
      mx.removeListener(RoomEvent.Redaction, handleUpdate);
      mx.removeListener(RoomEvent.LocalEchoUpdated, handleUpdate);
    };
  }, [mx, room]);

  useEffect(() => {
    if (!eventId) {
      setFetchedReplies([]);
      return undefined;
    }
    let disposed = false;
    mx.relations(room.roomId, eventId, RelationType.Thread, MessageEvent.RoomMessage)
      .then((result) => {
        if (!disposed) setFetchedReplies(result.events);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
    };
  }, [mx, room, eventId]);

  return useMemo(() => {
    if (!eventId) return [];
    const localRelations = getEventThreadReplies(room.getUnfilteredTimelineSet(), eventId);
    const localReplies = localRelations?.getRelations() ?? [];

    const byId = new Map<string, MatrixEvent>();
    [...fetchedReplies, ...localReplies].forEach((event) => {
      const id = event.getId();
      if (id) byId.set(id, event);
    });

    return Array.from(byId.values())
      .filter((event) => !event.isRedacted())
      .sort((a, b) => a.getTs() - b.getTs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, eventId, fetchedReplies, tick]);
};
