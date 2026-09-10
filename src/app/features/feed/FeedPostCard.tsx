import React, { useCallback, useMemo } from 'react';
import { MatrixEvent, MsgType, Room } from 'matrix-js-sdk';
import { Opts as LinkifyOpts } from 'linkifyjs';
import { HTMLReactParserOptions } from 'html-react-parser';
import { Avatar, Box, Icon, Icons, Text, config } from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useMentionClickHandler } from '../../hooks/useMentionClickHandler';
import { useSpoilerClickHandler } from '../../hooks/useSpoilerClickHandler';
import {
  factoryRenderLinkifyWithMention,
  getReactCustomHtmlParser,
  LINKIFY_OPTS,
  makeMentionCustomProps,
  renderMatrixMention,
} from '../../plugins/react-custom-html-parser';
import { getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
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
import { GetContentCallback } from '../../../types/matrix/room';
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
    </SequenceCard>
  );
}
