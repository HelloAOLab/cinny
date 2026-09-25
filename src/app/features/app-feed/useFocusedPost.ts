import { useEffect, useState } from 'react';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import to from 'await-to-js';
import { CryptoBackend } from 'matrix-js-sdk/lib/common-crypto/CryptoBackend';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getPostIdForEvent } from '../app-inbox/appRoomTarget';

export type FocusedPost = {
  /** The post to scroll to and highlight. */
  postId: string;
  /** Whether the linked event was a comment on the post, not the post itself. */
  isComment: boolean;
  /** The post event, once found locally or fetched from the server. */
  post?: MatrixEvent;
};

/**
 * Resolves an event linked into the feed (e.g. from a notification) to the
 * post it belongs to. The event may be a comment, and either may be older
 * than the history the feed has loaded, so both are fetched when needed.
 */
export const useFocusedPost = (
  room: Room | undefined,
  eventId: string | undefined
): FocusedPost | undefined => {
  const mx = useMatrixClient();
  const [focused, setFocused] = useState<FocusedPost>();

  useEffect(() => {
    setFocused(undefined);
    if (!room || !eventId) return undefined;
    let disposed = false;

    const fetchEvent = async (id: string): Promise<MatrixEvent | undefined> => {
      const local = room.findEventById(id);
      if (local) return local;
      const [err, raw] = await to(mx.fetchRoomEvent(room.roomId, id));
      if (err || !raw) return undefined;
      const mEvent = new MatrixEvent(raw);
      if (mEvent.isEncrypted() && mx.getCrypto()) {
        await to(mEvent.attemptDecryption(mx.getCrypto() as CryptoBackend));
      }
      return mEvent;
    };

    (async () => {
      const linked = await fetchEvent(eventId);
      if (disposed || !linked) return;
      // Relations stay in the clear in encrypted events, so the wire content
      // is enough to find the post a comment belongs to.
      const postId = getPostIdForEvent(eventId, linked.getWireContent());
      const isComment = postId !== eventId;
      setFocused({ postId, isComment, post: isComment ? undefined : linked });
      if (!isComment) return;

      const post = await fetchEvent(postId);
      if (disposed || !post) return;
      setFocused({ postId, isComment, post });
    })();

    return () => {
      disposed = true;
    };
  }, [mx, room, eventId]);

  return focused;
};
