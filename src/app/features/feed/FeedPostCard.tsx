import React, { useCallback, useMemo, useState } from 'react';
import { MatrixEvent, MsgType, Room } from 'matrix-js-sdk';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { HTMLReactParserOptions } from 'html-react-parser';
import { Avatar, Box, Icon, IconButton, Icons, PopOut, RectCords, Text, config } from 'folds';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../hooks/useSpoilerClickHandler';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useImagePackRooms } from '../../hooks/useImagePackRooms';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../plugins/react-custom-html-parser';
import {
  getEventReactions,
  getMemberAvatarMxc,
  getMemberDisplayName,
  getReactionContent,
} from '../../utils/room';
import {
  eventWithShortcode,
  factoryEventSentBy,
  getMxIdLocalPart,
  mxcUrlToHttp,
} from '../../utils/matrix';
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

type FeedPostCardProps = {
  room: Room;
  event: MatrixEvent;
  mediaAutoLoad?: boolean;
  urlPreview?: boolean;
};

export function FeedPostCard({ room, event, mediaAutoLoad, urlPreview }: FeedPostCardProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const mentionClickHandler = useMentionClickHandler(room.roomId);
  const spoilerClickHandler = useSpoilerClickHandler();

  const content = event.getContent();
  const msgType = typeof content.msgtype === 'string' ? content.msgtype : undefined;
  const senderId = event.getSender();
  const displayName =
    (senderId && getMemberDisplayName(room, senderId)) ??
    (senderId && getMxIdLocalPart(senderId)) ??
    senderId ??
    '';
  const senderAvatarMxc = senderId ? getMemberAvatarMxc(room, senderId) : undefined;
  const senderAvatarUrl = senderAvatarMxc
    ? mxcUrlToHttp(mx, senderAvatarMxc, useAuthentication, 48, 48, 'crop') ?? undefined
    : undefined;

  const getContent = useCallback(() => content, [content]) as GetContentCallback;

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

  const eventId = event.getId();
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

  const handleReactionToggle = useCallback(
    (targetEventId: string, key: string, shortcode?: string) => {
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

  if (!msgType) return null;

  const isImagePost = msgType === MsgType.Image;
  const showImageCaption =
    isImagePost &&
    typeof content.body === 'string' &&
    typeof content.filename === 'string' &&
    content.filename !== content.body;

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
      {isImagePost && (
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
      )}
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
      {isImagePost ? (
        showImageCaption && (
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
        )
      ) : (
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
      )}
      {(canSendReaction || hasReactions) && eventId && (
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
      )}
    </SequenceCard>
  );
}
