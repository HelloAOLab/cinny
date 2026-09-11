import { useEffect, useMemo, useState } from 'react';
import { MatrixEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { getEventThreadReplies } from '../utils/room';

export const useThreadReplies = (room: Room, eventId: string | undefined): MatrixEvent[] => {
  const mx = useMatrixClient();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick((t) => t + 1);
    mx.on(RoomEvent.Timeline, handleUpdate);
    mx.on(RoomEvent.TimelineReset, handleUpdate);
    mx.on(RoomEvent.Redaction, handleUpdate);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleUpdate);
      mx.removeListener(RoomEvent.TimelineReset, handleUpdate);
      mx.removeListener(RoomEvent.Redaction, handleUpdate);
    };
  }, [mx, room]);

  return useMemo(() => {
    if (!eventId) return [];
    const relations = getEventThreadReplies(room.getUnfilteredTimelineSet(), eventId);
    const replies = relations?.getRelations() ?? [];
    return [...replies].sort((a, b) => a.getTs() - b.getTs());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, eventId, tick]);
};
