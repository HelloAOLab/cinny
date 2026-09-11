import React, { useCallback, useMemo, useState } from 'react';
import { MatrixEvent, MsgType, Room } from 'matrix-js-sdk';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { HTMLReactParserOptions } from 'html-react-parser';
import { Avatar, Box, Chip, Icon, IconButton, Icons, PopOut, RectCords, Text, config } from 'folds';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../hooks/useSpoilerClickHandler';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useImagePackRooms } from '../../hooks/useImagePackRooms';
import { useReactionToggle } from '../../hooks/useReactionToggle';
import { useThreadReplies } from '../../hooks/useThreadReplies';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../plugins/react-custom-html-parser';
import { getEventReactions, getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { RenderMessageContent } from '../../components/RenderMessageContent';
import {
  ImageContent,
  MImage,
  MText,
  RenderBody,
  Username,
  UsernameBold,
} from '../../components/message';
import { Image } from '../../components/media';
import { ImageViewer } from '../../components/image-viewer';
import { SequenceCard } from '../../components/sequence-card';
import { UserAvatar } from '../../components/user-avatar';
import { EmojiBoard } from '../../components/emoji-board';
import { Reactions } from '../room/message';
import { GetContentCallback, MessageEvent } from '../../../types/matrix/room';
import { IImageContent } from '../../../types/matrix/common';

type FeedPostEventBodyProps = {
  event: MatrixEvent;
  displayName: string;
  mediaAutoLoad?: boolean;
  urlPreview?: boolean;
  htmlReactParserOptions: HTMLReactParserOptions;
  linkifyOpts: LinkifyOpts;
};
function FeedPostEventBody({
  event,
  displayName,
  mediaAutoLoad,
  urlPreview,
  htmlReactParserOptions,
  linkifyOpts,
}: FeedPostEventBodyProps) {
  const content = event.getContent();
  const msgType = typeof content.msgtype === 'string' ? content.msgtype : undefined;
  const getContent = useCallback(() => content, [content]) as GetContentCallback;

  if (!msgType) return null;

  const isImagePost = msgType === MsgType.Image;
  const showImageCaption =
    isImagePost &&
    typeof content.body === 'string' &&
    typeof content.filename === 'string' &&
    content.filename !== content.body;

  if (isImagePost) {
    return (
      <>
        <MImage
          content={content as IImageContent}
          renderImageContent={(props) => (
            <ImageContent
              {...props}
              autoPlay={mediaAutoLoad}
              renderImage={(p) => <Image {...p} loading="lazy" />}
              renderViewer={(p) => <ImageViewer {...p} />}
            />
          )}
        />
        {showImageCaption && (
          <MText
            content={content}
            renderBody={(p) => (
              <RenderBody
                {...p}
                htmlReactParserOptions={htmlReactParserOptions}
                linkifyOpts={linkifyOpts}
              />
            )}
          />
        )}
      </>
    );
  }

  return (
    <Box direction="Column">
      <RenderMessageContent
        displayName={displayName}
        msgType={msgType}
        ts={event.getTs()}
        getContent={getContent}
        mediaAutoLoad={mediaAutoLoad}
        urlPreview={urlPreview}
        htmlReactParserOptions={htmlReactParserOptions}
        linkifyOpts={linkifyOpts}
      />
    </Box>
  );
}

type FeedPostCardProps = {
  room: Room;
  /** Events from the same sender, close together in time, oldest first. Non-empty. */
  events: MatrixEvent[];
  mediaAutoLoad?: boolean;
  urlPreview?: boolean;
  onOpenComments?: (room: Room, event: MatrixEvent) => void;
};

export function FeedPostCard({
  room,
  events,
  mediaAutoLoad,
  urlPreview,
  onOpenComments,
}: FeedPostCardProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();

  // Reactions and the comment thread anchor to the most recent event in the
  // group, since that's the one a reply/reaction would naturally target.
  const primaryEvent = events[events.length - 1];
  const senderId = primaryEvent.getSender();
  const displayName =
    (senderId && getMemberDisplayName(room, senderId)) ??
    (senderId && getMxIdLocalPart(senderId)) ??
    senderId ??
    '';
  const senderAvatarMxc = senderId ? getMemberAvatarMxc(room, senderId) : undefined;
  const senderAvatarUrl = senderAvatarMxc
    ? mxcUrlToHttp(mx, senderAvatarMxc, useAuthentication, 48, 48, 'crop') ?? undefined
    : undefined;

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

  const eventId = primaryEvent.getId();
  const [emojiBoardAnchor, setEmojiBoardAnchor] = useState<RectCords>();

  const roomToParents = useAtomValue(roomToParentsAtom);
  const imagePackRooms = useImagePackRooms(room.roomId, roomToParents);
  const creators = useRoomCreators(room);
  const powerLevels = usePowerLevels(room);
  const permissions = useRoomPermissions(creators, powerLevels);
  const canSendReaction = permissions.event(MessageEvent.Reaction, mx.getSafeUserId());

  const reactionRelations = eventId
    ? getEventReactions(room.getUnfilteredTimelineSet(), eventId)
    : undefined;
  const hasReactions = (reactionRelations?.getSortedAnnotationsByKey()?.length ?? 0) > 0;
  const handleReactionToggle = useReactionToggle(room);

  const commentCount = useThreadReplies(room, eventId).length;

  return (
    <SequenceCard
      variant="SurfaceVariant"
      direction="Column"
      gap="300"
      style={{ padding: config.space.S400 }}
    >
      <Text as="h4" size="H4" truncate>
        {room.name}
      </Text>
      <Box alignItems="Center" gap="200">
        <Avatar size="300">
          <UserAvatar
            userId={senderId ?? ''}
            src={senderAvatarUrl}
            alt={displayName}
            renderFallback={() => <Icon size="200" src={Icons.User} filled />}
          />
        </Avatar>
        <Username>
          <Text as="span" truncate>
            <UsernameBold>{displayName}</UsernameBold>
          </Text>
        </Username>
      </Box>
      {events.map((event) => (
        <FeedPostEventBody
          key={event.getId()}
          event={event}
          displayName={displayName}
          mediaAutoLoad={mediaAutoLoad}
          urlPreview={urlPreview}
          htmlReactParserOptions={htmlReactParserOptions}
          linkifyOpts={linkifyOpts}
        />
      ))}
      {eventId && (
        <Box alignItems="Center" justifyContent="SpaceBetween" gap="200">
          <Box alignItems="Center" gap="200" wrap="Wrap">
            {canSendReaction && (
              <PopOut
                position="Bottom"
                align="Start"
                anchor={emojiBoardAnchor}
                content={
                  <EmojiBoard
                    imagePackRooms={imagePackRooms}
                    returnFocusOnDeactivate={false}
                    allowTextCustomEmoji
                    onEmojiSelect={(key) => {
                      handleReactionToggle(eventId, key);
                      setEmojiBoardAnchor(undefined);
                    }}
                    onCustomEmojiSelect={(mxc, shortcode) => {
                      handleReactionToggle(eventId, mxc, shortcode);
                      setEmojiBoardAnchor(undefined);
                    }}
                    requestClose={() => setEmojiBoardAnchor(undefined)}
                  />
                }
              >
                <IconButton
                  onClick={(evt) => setEmojiBoardAnchor(evt.currentTarget.getBoundingClientRect())}
                  variant="SurfaceVariant"
                  size="300"
                  radii="300"
                  aria-pressed={!!emojiBoardAnchor}
                >
                  <Icon src={Icons.SmilePlus} size="100" />
                </IconButton>
              </PopOut>
            )}
            {reactionRelations && hasReactions && (
              <Reactions
                room={room}
                relations={reactionRelations}
                mEventId={eventId}
                canSendReaction={canSendReaction}
                onReactionToggle={handleReactionToggle}
              />
            )}
          </Box>
          <Chip
            onClick={() => onOpenComments?.(room, primaryEvent)}
            variant="SurfaceVariant"
            radii="Pill"
            before={<Icon size="100" src={Icons.Message} />}
          >
            <Text size="T200">{commentCount}</Text>
          </Chip>
        </Box>
      )}
    </SequenceCard>
  );
}
