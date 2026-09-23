import React, { useCallback, useMemo } from 'react';
import { MatrixEvent, MsgType, Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../hooks/useSpoilerClickHandler';
import { useThreadReplies } from '../../hooks/useThreadReplies';
import { useReactionToggle } from '../../hooks/useReactionToggle';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../plugins/react-custom-html-parser';
import { getEventReactions, getMemberDisplayName, getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { mxcUrlToHttp } from '../../utils/matrix';
import { relativeTime } from '../../utils/time';
import { RenderMessageContent } from '../../components/RenderMessageContent';
import { MImage, ImageContent } from '../../components/message';
import { Image } from '../../components/media';
import { ImageViewer } from '../../components/image-viewer';
import { GetContentCallback, MessageEvent } from '../../../types/matrix/room';
import { IImageContent } from '../../../types/matrix/common';
import { AMEN_REACTION_KEY, summarizePostReactions } from './postReactions';
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
  community: Room;
  onOpenComments: (room: Room, event: MatrixEvent) => void;
};

export function AppPostCard({ room, event, community, onOpenComments }: AppPostCardProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();

  const senderId = event.getSender();
  const displayName = (senderId && getMemberDisplayName(room, senderId)) ?? senderId ?? '';
  const communityAvatarUrl = getRoomAvatarUrl(mx, community, 96, useAuthentication);

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
  const reactions = summarizePostReactions(
    reactionRelations?.getSortedAnnotationsByKey() ?? [],
    mx.getUserId()
  );
  const reactedAmen = reactions.some((r) => r.key === AMEN_REACTION_KEY && r.mine);
  const commentCount = useThreadReplies(room, eventId).length;

  const creators = useRoomCreators(room);
  const powerLevels = usePowerLevels(room);
  const permissions = useRoomPermissions(creators, powerLevels);
  const canSendReaction = permissions.event(MessageEvent.Reaction, mx.getSafeUserId());
  const handleReactionToggle = useReactionToggle(room);

  const handleOpenComments = () => onOpenComments(room, event);

  return (
    <article className={css.Card}>
      <div className={css.CardHeader}>
        <span className={css.Avatar}>
          {communityAvatarUrl ? (
            <img src={communityAvatarUrl} alt="" width={44} height={44} />
          ) : (
            nameInitials(community.name, 2)
          )}
        </span>
        <div className={css.CardHeaderText}>
          <div className={css.RoomName}>{community.name}</div>
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

      {eventId && (reactions.length > 0 || commentCount > 0) && (
        <div className={css.ReactionsRow}>
          {reactions.map((reaction) => (
            <button
              key={reaction.key}
              type="button"
              className={`${css.ReactionChip} ${reaction.mine ? css.ReactionChipMine : ''}`}
              aria-pressed={reaction.mine}
              aria-label={`${reaction.key === AMEN_REACTION_KEY ? 'Amen' : reaction.key}: ${
                reaction.count
              }`}
              disabled={!canSendReaction}
              onClick={() => handleReactionToggle(eventId, reaction.key)}
            >
              {reaction.key === AMEN_REACTION_KEY && AMEN_ICON}
              {reaction.key !== AMEN_REACTION_KEY &&
                (reaction.key.startsWith('mxc://') ? (
                  <img
                    className={css.ReactionImg}
                    src={mxcUrlToHttp(mx, reaction.key, useAuthentication) ?? reaction.key}
                    alt=""
                  />
                ) : (
                  <span className={css.ReactionEmoji}>{reaction.key}</span>
                ))}
              <span>{reaction.count}</span>
            </button>
          ))}
          <span className={css.ReactionsSpacer} />
          {commentCount > 0 && (
            <button type="button" className={css.CommentCount} onClick={handleOpenComments}>
              {commentCount} comment{commentCount === 1 ? '' : 's'}
            </button>
          )}
        </div>
      )}

      {eventId && (
        <div className={css.ActionBar}>
          <button
            type="button"
            className={`${css.ActionButton} ${reactedAmen ? css.ActionButtonActive : ''}`}
            aria-pressed={reactedAmen}
            disabled={!canSendReaction}
            onClick={() => handleReactionToggle(eventId, AMEN_REACTION_KEY)}
          >
            {AMEN_ICON} Amen
          </button>
          <button
            type="button"
            className={`${css.ActionButton} ${css.ActionButtonDivider}`}
            onClick={handleOpenComments}
          >
            {COMMENT_ICON} Comment
          </button>
        </div>
      )}
    </article>
  );
}
