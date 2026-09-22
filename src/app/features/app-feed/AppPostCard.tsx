import React, { useCallback, useMemo } from 'react';
import { MatrixEvent, MsgType, Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../hooks/useSpoilerClickHandler';
import { useThreadReplies } from '../../hooks/useThreadReplies';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../plugins/react-custom-html-parser';
import { getEventReactions, getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
import { mxcUrlToHttp } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import { relativeTime } from '../../utils/time';
import { RenderMessageContent } from '../../components/RenderMessageContent';
import { MImage, ImageContent } from '../../components/message';
import { Image } from '../../components/media';
import { ImageViewer } from '../../components/image-viewer';
import { GetContentCallback } from '../../../types/matrix/room';
import { IImageContent } from '../../../types/matrix/common';
import * as css from './AppPostCard.css';

const AMEN_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 21c-1.5 0-2.6-.5-3.4-1.2L4.8 16.4c-.7-.6-.8-1.6-.2-2.2.6-.6 1.5-.7 2.2-.1l1.5 1.3V6.8c0-1 .8-1.7 1.7-1.6.7.1 1.1.8 1.1 1.5V12" />
    <path d="M12 21c1.5 0 2.6-.5 3.4-1.2l3.8-3.4c.7-.6.8-1.6.2-2.2-.6-.6-1.5-.7-2.2-.1l-1.5 1.3V6.8c0-1-.8-1.7-1.7-1.6-.7.1-1.1.8-1.1 1.5V12" />
  </svg>
);

const COMMENT_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

const OPTIONS_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="12" cy="19" r="1.8" />
  </svg>
);

type AppPostCardProps = {
  room: Room;
  event: MatrixEvent;
  communityName: string;
};

export function AppPostCard({ room, event, communityName }: AppPostCardProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();

  const senderId = event.getSender();
  const displayName = (senderId && getMemberDisplayName(room, senderId)) ?? senderId ?? '';
  const senderAvatarMxc = senderId ? getMemberAvatarMxc(room, senderId) : undefined;
  const senderAvatarUrl = senderAvatarMxc
    ? mxcUrlToHttp(mx, senderAvatarMxc, useAuthentication, 88, 88, 'crop') ?? undefined
    : undefined;

  const linkifyOpts = useMemo(
    () => ({
      ...LINKIFY_OPTS,
      render: factoryRenderLinkifyWithMention((href) =>
        renderMatrixMention(mx, room.roomId, href, makeMentionCustomProps(mentionClickHandler))
      ),
    }),
    [mx, room, mentionClickHandler]
  );
  const htmlReactParserOptions = useMemo(
    () =>
      getReactCustomHtmlParser(mx, room.roomId, {
        linkifyOpts,
        useAuthentication,
        handleSpoilerClick: spoilerClickHandler,
        handleMentionClick: mentionClickHandler,
      }),
    [mx, room, linkifyOpts, mentionClickHandler, spoilerClickHandler, useAuthentication]
  );

  const content = event.getContent();
  const msgType = typeof content.msgtype === 'string' ? content.msgtype : undefined;
  const getContent = useCallback(() => content, [content]) as GetContentCallback;
  const isImagePost = msgType === MsgType.Image;

  const eventId = event.getId();
  const reactionRelations = eventId
    ? getEventReactions(room.getUnfilteredTimelineSet(), eventId)
    : undefined;
  const reactionCount = (reactionRelations?.getSortedAnnotationsByKey() ?? []).reduce(
    (count, [, events]) => count + events.size,
    0
  );
  const commentCount = useThreadReplies(room, eventId).length;

  return (
    <article className={css.Card}>
      <div className={css.CardHeader}>
        <span className={css.Avatar}>
          {senderAvatarUrl ? (
            <img src={senderAvatarUrl} alt="" width={44} height={44} />
          ) : (
            nameInitials(displayName, 2)
          )}
        </span>
        <div className={css.CardHeaderText}>
          <div className={css.RoomName}>{communityName}</div>
          <div className={css.SenderLine}>
            {displayName} · {relativeTime(event.getTs())}
          </div>
        </div>
        {/* TODO: no message-options menu wired up yet */}
        <button type="button" aria-label="Post options" className={css.OptionsButton}>
          {OPTIONS_ICON}
        </button>
      </div>

      {isImagePost && (
        <div className={css.CoverImage}>
          <MImage
            content={content as IImageContent}
            renderImageContent={(props) => (
              <ImageContent
                {...props}
                autoPlay
                renderImage={(p) => <Image {...p} loading="lazy" />}
                renderViewer={(p) => <ImageViewer {...p} />}
              />
            )}
          />
        </div>
      )}

      {!isImagePost && msgType && (
        <div className={css.Body}>
          <RenderMessageContent
            displayName={displayName}
            msgType={msgType}
            ts={event.getTs()}
            getContent={getContent}
            mediaAutoLoad
            urlPreview={false}
            htmlReactParserOptions={htmlReactParserOptions}
            linkifyOpts={linkifyOpts}
          />
        </div>
      )}

      {eventId && (
        <div className={css.ReactionsRow}>
          {reactionCount > 0 && (
            <>
              <span className={css.ReactionBadges}>
                <span
                  className={css.ReactionBadge}
                  style={{ background: '#e7f3fa', color: '#1596ce' }}
                >
                  {AMEN_ICON}
                </span>
              </span>
              <span className={css.ReactionCount}>{reactionCount}</span>
            </>
          )}
          <span className={css.ReactionsSpacer} />
          {commentCount > 0 && (
            <span className={css.CommentCount}>
              {commentCount} comment{commentCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      <div className={css.ActionBar}>
        {/* TODO: not wired up yet - could toggle an "Amen" reaction on eventId */}
        <button type="button" className={css.ActionButton}>
          {AMEN_ICON} Amen
        </button>
        {/* TODO: could open src/app/features/feed/comments/CommentsPanel for this room+event */}
        <button type="button" className={`${css.ActionButton} ${css.ActionButtonDivider}`}>
          {COMMENT_ICON} Comment
        </button>
      </div>
    </article>
  );
}
