import React, {
  ChangeEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import { MatrixEvent, MsgType, RelationType, Room } from 'matrix-js-sdk';
import { Box, Header, Icon, IconButton, Icons, Input, Scroll, Text, config } from 'folds';
import { useAtomValue } from 'jotai';
import classNames from 'classnames';
import * as css from './CommentsPanel.css';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
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
import { getEventReactions, getMemberDisplayName } from '../../../utils/room';
import { getMxIdLocalPart } from '../../../utils/matrix';
import { MessageEvent } from '../../../../types/matrix/room';
import { Message, Reactions } from '../../room/message';
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
}: CommentProps) {
  const mEventId = mEvent.getId();
  const reactionRelations = mEventId
    ? getEventReactions(room.getUnfilteredTimelineSet(), mEventId)
    : undefined;
  const hasReactions = (reactionRelations?.getSortedAnnotationsByKey()?.length ?? 0) > 0;

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
    />
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
  const [draft, setDraft] = useState('');
  const [editId, setEditId] = useState<string>();

  const [messageLayout] = useSetting(settingsAtom, 'messageLayout');
  const [messageSpacing] = useSetting(settingsAtom, 'messageSpacing');
  const [hour24Clock] = useSetting(settingsAtom, 'hour24Clock');
  const [dateFormatString] = useSetting(settingsAtom, 'dateFormatString');

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
      const mention = name.startsWith('@') ? name : `@${name}`;
      setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}${mention} `);
    },
    [room]
  );

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || !rootEventId) return;
    mx.sendMessage(room.roomId, {
      msgtype: MsgType.Text,
      body,
      'm.relates_to': {
        rel_type: RelationType.Thread,
        event_id: rootEventId,
        is_falling_back: true,
        'm.in_reply_to': {
          event_id: rootEventId,
        },
      },
    } as any);
    setDraft('');
  }, [mx, room, rootEventId, draft]);

  const handleDraftChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    setDraft(evt.target.value);
  };
  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
    if (evt.key === 'Enter' && !evt.shiftKey) {
      evt.preventDefault();
      handleSend();
    }
  };

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
              />
            ))}
          </Box>
        </Scroll>
      </Box>
      {canSendMessage && (
        <Box className={css.CommentsPanelFooter} shrink="No">
          <Input
            style={{ width: '100%' }}
            value={draft}
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            variant="SurfaceVariant"
            size="400"
            radii="400"
            after={
              <IconButton
                variant="SurfaceVariant"
                size="300"
                radii="300"
                onClick={handleSend}
                aria-disabled={draft.trim().length === 0}
                aria-label="Send comment"
              >
                <Icon size="100" src={Icons.Send} />
              </IconButton>
            }
          />
        </Box>
      )}
    </Box>
  );
}
