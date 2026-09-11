import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import { ReactEditor } from 'slate-react';
import { Box, Header, Icon, IconButton, Icons, Scroll, Text, config } from 'folds';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { HTMLReactParserOptions } from 'html-react-parser';
import { useAtomValue } from 'jotai';
import classNames from 'classnames';
import * as css from './CommentsPanel.css';
import { CommentComposer } from './CommentComposer';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../../hooks/useSpoilerClickHandler';
import { useImagePackRooms } from '../../../hooks/useImagePackRooms';
import { useRoomCreators } from '../../../hooks/useRoomCreators';
import { usePowerLevels } from '../../../hooks/usePowerLevels';
import { useRoomPermissions } from '../../../hooks/useRoomPermissions';
import { useReactionToggle } from '../../../hooks/useReactionToggle';
import { useThreadReplies } from '../../../hooks/useThreadReplies';
import { useOpenUserRoomProfile } from '../../../state/hooks/userRoomProfile';
import { useSetting } from '../../../state/hooks/settings';
import { MessageLayout, MessageSpacing, settingsAtom } from '../../../state/settings';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { createMentionElement, moveCursor, useEditor } from '../../../components/editor';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../../plugins/react-custom-html-parser';
import { getEditedEvent, getEventReactions, getMemberDisplayName } from '../../../utils/room';
import { getMxIdLocalPart } from '../../../utils/matrix';
import { GetContentCallback, MessageEvent } from '../../../../types/matrix/room';
import { Message, Reactions } from '../../room/message';
import { RenderMessageContent } from '../../../components/RenderMessageContent';
import { ContainerColor } from '../../../styles/ContainerColor.css';

const noop = () => undefined;

type CommentProps = {
  room: Room;
  mEvent: MatrixEvent;
  canSendReaction: boolean;
  canDelete: boolean;
  imagePackRooms: Room[];
  editId?: string;
  onEditId: (eventId?: string) => void;
  onUserClick: MouseEventHandler<HTMLButtonElement>;
  onUsernameClick: MouseEventHandler<HTMLButtonElement>;
  onReactionToggle: (targetEventId: string, key: string, shortcode?: string) => void;
  messageLayout: MessageLayout;
  messageSpacing: MessageSpacing;
  hour24Clock: boolean;
  dateFormatString: string;
  mediaAutoLoad?: boolean;
  urlPreview?: boolean;
  linkifyOpts: LinkifyOpts;
  htmlReactParserOptions: HTMLReactParserOptions;
};
function Comment({
  room,
  mEvent,
  canSendReaction,
  canDelete,
  imagePackRooms,
  editId,
  onEditId,
  onUserClick,
  onUsernameClick,
  onReactionToggle,
  messageLayout,
  messageSpacing,
  hour24Clock,
  dateFormatString,
  mediaAutoLoad,
  urlPreview,
  linkifyOpts,
  htmlReactParserOptions,
}: CommentProps) {
  const mEventId = mEvent.getId();
  const reactionRelations = mEventId
    ? getEventReactions(room.getUnfilteredTimelineSet(), mEventId)
    : undefined;
  const hasReactions = (reactionRelations?.getSortedAnnotationsByKey()?.length ?? 0) > 0;

  const editedEvent = mEventId
    ? getEditedEvent(mEventId, mEvent, room.getUnfilteredTimelineSet())
    : undefined;
  const getContent = useCallback(
    () => editedEvent?.getContent()['m.new_content'] ?? mEvent.getContent(),
    [editedEvent, mEvent]
  ) as GetContentCallback;
  const senderId = mEvent.getSender() ?? '';
  const senderDisplayName =
    getMemberDisplayName(room, senderId) ?? getMxIdLocalPart(senderId) ?? senderId;

  return (
    <Message
      room={room}
      mEvent={mEvent}
      collapse={false}
      highlight={false}
      edit={mEventId !== undefined && editId === mEventId}
      canDelete={canDelete}
      canSendReaction={canSendReaction}
      imagePackRooms={imagePackRooms}
      relations={hasReactions ? reactionRelations : undefined}
      messageLayout={messageLayout}
      messageSpacing={messageSpacing}
      onUserClick={onUserClick}
      onUsernameClick={onUsernameClick}
      onReplyClick={noop}
      onReactionToggle={onReactionToggle}
      onEditId={onEditId}
      reactions={
        reactionRelations &&
        hasReactions &&
        mEventId && (
          <Reactions
            style={{ marginTop: config.space.S200 }}
            room={room}
            relations={reactionRelations}
            mEventId={mEventId}
            canSendReaction={canSendReaction}
            onReactionToggle={onReactionToggle}
          />
        )
      }
      hideReadReceipts
      hour24Clock={hour24Clock}
      dateFormatString={dateFormatString}
    >
      <RenderMessageContent
        displayName={senderDisplayName}
        msgType={mEvent.getContent().msgtype ?? ''}
        ts={mEvent.getTs()}
        edited={!!editedEvent}
        getContent={getContent}
        mediaAutoLoad={mediaAutoLoad}
        urlPreview={urlPreview}
        htmlReactParserOptions={htmlReactParserOptions}
        linkifyOpts={linkifyOpts}
      />
    </Message>
  );
}

type CommentsPanelProps = {
  room: Room;
  postEvent: MatrixEvent;
  requestClose: () => void;
};
export function CommentsPanel({ room, postEvent, requestClose }: CommentsPanelProps) {
  const mx = useMatrixClient();
  const rootEventId = postEvent.getId();
  const editor = useEditor();
  const [editId, setEditId] = useState<string>();

  const [messageLayout] = useSetting(settingsAtom, 'messageLayout');
  const [messageSpacing] = useSetting(settingsAtom, 'messageSpacing');
  const [hour24Clock] = useSetting(settingsAtom, 'hour24Clock');
  const [dateFormatString] = useSetting(settingsAtom, 'dateFormatString');
  const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
  const [urlPreview] = useSetting(settingsAtom, 'urlPreview');

  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();

  const linkifyOpts = useMemo<LinkifyOpts>(
    () => ({
      ...LINKIFY_OPTS,
      render: factoryRenderLinkifyWithMention((href) =>
        renderMatrixMention(mx, room.roomId, href, makeMentionCustomProps(mentionClickHandler))
      ),
    }),
    [mx, room, mentionClickHandler]
  );
  const htmlReactParserOptions = useMemo<HTMLReactParserOptions>(
    () =>
      getReactCustomHtmlParser(mx, room.roomId, {
        linkifyOpts,
        useAuthentication,
        handleSpoilerClick: spoilerClickHandler,
        handleMentionClick: mentionClickHandler,
      }),
    [mx, room, linkifyOpts, mentionClickHandler, spoilerClickHandler, useAuthentication]
  );

  const roomToParents = useAtomValue(roomToParentsAtom);
  const imagePackRooms = useImagePackRooms(room.roomId, roomToParents);
  const creators = useRoomCreators(room);
  const powerLevels = usePowerLevels(room);
  const permissions = useRoomPermissions(creators, powerLevels);
  const canSendReaction = permissions.event(MessageEvent.Reaction, mx.getSafeUserId());
  const canSendMessage = permissions.event(MessageEvent.RoomMessage, mx.getSafeUserId());
  const canRedact = permissions.action('redact', mx.getSafeUserId());
  const canDeleteOwn = permissions.event(MessageEvent.RoomRedaction, mx.getSafeUserId());

  const openUserRoomProfile = useOpenUserRoomProfile();
  const handleReactionToggle = useReactionToggle(room);

  const replies = useThreadReplies(room, rootEventId);

  const handleUserClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const userId = evt.currentTarget.getAttribute('data-user-id');
      if (!userId) return;
      openUserRoomProfile(
        room.roomId,
        undefined,
        userId,
        evt.currentTarget.getBoundingClientRect()
      );
    },
    [room, openUserRoomProfile]
  );
  const handleUsernameClick: MouseEventHandler<HTMLButtonElement> = useCallback(
    (evt) => {
      evt.preventDefault();
      const userId = evt.currentTarget.getAttribute('data-user-id');
      if (!userId) return;
      const name = getMemberDisplayName(room, userId) ?? getMxIdLocalPart(userId) ?? userId;
      editor.insertNode(
        createMentionElement(
          userId,
          name.startsWith('@') ? name : `@${name}`,
          userId === mx.getUserId()
        )
      );
      ReactEditor.focus(editor);
      moveCursor(editor);
    },
    [mx, room, editor]
  );

  return (
    <Box
      className={classNames(css.CommentsPanel, ContainerColor({ variant: 'Background' }))}
      shrink="No"
      direction="Column"
    >
      <Header className={css.CommentsPanelHeader} variant="Background" size="600">
        <Box grow="Yes" alignItems="Center" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H5" truncate>
              {`${replies.length} ${replies.length === 1 ? 'Comment' : 'Comments'}`}
            </Text>
          </Box>
          <Box shrink="No" alignItems="Center">
            <IconButton variant="Background" onClick={requestClose} aria-label="Close">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </Header>
      <Box className={css.CommentsPanelContent} grow="Yes" direction="Column">
        <Scroll variant="Background" size="300" visibility="Hover" hideTrack>
          <Box className={css.CommentsList} direction="Column" gap="400">
            {replies.length === 0 && (
              <Text style={{ padding: config.space.S300 }} align="Center" priority="300">
                No comments yet
              </Text>
            )}
            {replies.map((reply) => (
              <Comment
                key={reply.getId()}
                room={room}
                mEvent={reply}
                canSendReaction={canSendReaction}
                canDelete={canRedact || (canDeleteOwn && reply.getSender() === mx.getUserId())}
                imagePackRooms={imagePackRooms}
                editId={editId}
                onEditId={setEditId}
                onUserClick={handleUserClick}
                onUsernameClick={handleUsernameClick}
                onReactionToggle={handleReactionToggle}
                messageLayout={messageLayout}
                messageSpacing={messageSpacing}
                hour24Clock={hour24Clock}
                dateFormatString={dateFormatString}
                mediaAutoLoad={mediaAutoLoad}
                urlPreview={urlPreview}
                linkifyOpts={linkifyOpts}
                htmlReactParserOptions={htmlReactParserOptions}
              />
            ))}
          </Box>
        </Scroll>
      </Box>
      {canSendMessage && rootEventId && (
        <Box className={css.CommentsPanelFooter} shrink="No" direction="Column">
          <CommentComposer
            editor={editor}
            room={room}
            rootEventId={rootEventId}
            imagePackRooms={imagePackRooms}
          />
        </Box>
      )}
    </Box>
  );
}
