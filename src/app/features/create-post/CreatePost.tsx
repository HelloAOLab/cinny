import React, {
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useAtomValue } from 'jotai';
import { IContent, JoinRule, MatrixError, MsgType, Room } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import { isKeyHotkey } from 'is-hotkey';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Icon,
  IconButton,
  Icons,
  Line,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Spinner,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import {
  CustomEditor,
  Toolbar,
  customHtmlEqualsPlainText,
  getMentions,
  resetEditor,
  resetEditorHistory,
  toMatrixCustomHTML,
  toPlainText,
  trimCustomHtml,
  useEditor,
} from '../../components/editor';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useComposingCheck } from '../../hooks/useComposingCheck';
import { useFilePicker } from '../../hooks/useFilePicker';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useAlive } from '../../hooks/useAlive';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { UploadStatus, UploadSuccess, createUploadFamilyObserverAtom } from '../../state/upload';
import {
  TUploadItem,
  TUploadMetadata,
  roomUploadAtomFamily,
} from '../../state/room/roomInputDrafts';
import { UploadCardRenderer } from '../../components/upload-card';
import { useSpacesWithPostsRoom } from '../feed';
import {
  getAudioMsgContent,
  getFileMsgContent,
  getImageMsgContent,
  getVideoMsgContent,
} from '../room/msgContent';
import { RoomAvatar } from '../../components/room-avatar';
import {
  nameInitials,
  millisecondsToMinutes,
  fulfilledPromiseSettledResult,
} from '../../utils/common';
import { getMentionContent, getRoomAvatarUrl } from '../../utils/room';
import { TUploadContent, encryptFile } from '../../utils/matrix';
import { safeFile } from '../../utils/mimeTypes';
import { ErrorCode } from '../../cs-errorcode';
import { stopPropagation } from '../../utils/keyboard';
import { isMacOS } from '../../utils/user-agent';
import { KeySymbol } from '../../utils/key-symbol';

type CreatePostFormProps = {
  defaultRoomId?: string;
  onCreate?: () => void;
};
export function CreatePostForm({ defaultRoomId, onCreate }: CreatePostFormProps) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const editor = useEditor();
  const useAuthentication = useMediaAuthentication();
  const spacesWithPostsRoom = useSpacesWithPostsRoom();
  const isComposing = useComposingCheck();

  const [isMarkdown] = useSetting(settingsAtom, 'isMarkdown');
  const [globalToolbar] = useSetting(settingsAtom, 'editorToolbar');
  const [toolbar, setToolbar] = useState(globalToolbar);

  const spaces = useMemo(
    () =>
      spacesWithPostsRoom
        .map(({ spaceId }) => mx.getRoom(spaceId))
        .filter((room): room is Room => room !== null),
    [mx, spacesWithPostsRoom]
  );

  const [spaceId, setSpaceId] = useState<string | undefined>(
    (defaultRoomId &&
      spacesWithPostsRoom.find(
        (space) => space.spaceId === defaultRoomId || space.postsRoomId === defaultRoomId
      )?.spaceId) ??
      spacesWithPostsRoom[0]?.spaceId
  );
  const selectedSpace = spaceId ? mx.getRoom(spaceId) : undefined;
  const postsRoomId = spacesWithPostsRoom.find((space) => space.spaceId === spaceId)?.postsRoomId;
  const selectedRoom = postsRoomId ? mx.getRoom(postsRoomId) : undefined;
  const isPublicRoom = selectedRoom?.getJoinRule() === JoinRule.Public;
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const [selectedFiles, setSelectedFiles] = useState<TUploadItem[]>([]);
  const uploadFamilyObserverAtom = useMemo(
    () =>
      createUploadFamilyObserverAtom(
        roomUploadAtomFamily,
        selectedFiles.map((f) => f.file)
      ),
    [selectedFiles]
  );
  const uploads = useAtomValue(uploadFamilyObserverAtom);
  const uploadsPending = uploads.some((upload) => upload.status !== UploadStatus.Success);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!selectedRoom) return;
      const safeFiles = files.map(safeFile);
      const fileItems: TUploadItem[] = [];

      if (selectedRoom.hasEncryptionStateEvent()) {
        const encryptedFiles = fulfilledPromiseSettledResult(
          await Promise.allSettled(safeFiles.map((f) => encryptFile(f)))
        );
        encryptedFiles.forEach((ef) =>
          fileItems.push({
            ...ef,
            metadata: { markedAsSpoiler: false },
          })
        );
      } else {
        safeFiles.forEach((f) =>
          fileItems.push({
            file: f,
            originalFile: f,
            encInfo: undefined,
            metadata: { markedAsSpoiler: false },
          })
        );
      }
      setSelectedFiles((items) => [...items, ...fileItems]);
    },
    [selectedRoom]
  );
  const pickFile = useFilePicker(handleFiles, true);

  const handleFileMetadata = useCallback((fileItem: TUploadItem, metadata: TUploadMetadata) => {
    setSelectedFiles((items) =>
      items.map((item) => (item === fileItem ? { ...item, metadata } : item))
    );
  }, []);

  const handleRemoveUpload = useCallback((file: TUploadContent) => {
    setSelectedFiles((items) => items.filter((item) => item.file !== file));
    roomUploadAtomFamily.remove(file);
  }, []);

  const sendAttachments = useCallback(
    async (successUploads: UploadSuccess[], caption?: { body: string; formattedBody?: string }) => {
      if (!postsRoomId) return;
      const contentsPromises = successUploads.map(async (upload) => {
        const fileItem = selectedFiles.find((f) => f.file === upload.file);
        if (!fileItem) throw new Error('Broken upload');
        if (fileItem.file.type.startsWith('image'))
          return getImageMsgContent(mx, fileItem, upload.mxc);
        if (fileItem.file.type.startsWith('video'))
          return getVideoMsgContent(mx, fileItem, upload.mxc);
        if (fileItem.file.type.startsWith('audio')) return getAudioMsgContent(fileItem, upload.mxc);
        return getFileMsgContent(fileItem, upload.mxc);
      });
      const contents = fulfilledPromiseSettledResult(await Promise.allSettled(contentsPromises));
      // A lone attachment carries the typed text as its caption (body distinct from
      // filename) so the feed renders it as a single post card instead of two.
      if (caption && contents.length === 1) {
        contents[0].body = caption.body;
        if (caption.formattedBody) {
          contents[0].format = 'org.matrix.custom.html';
          contents[0].formatted_body = caption.formattedBody;
        }
      }
      await Promise.all(
        contents.map((content) =>
          mx.sendMessage(postsRoomId, { ...content, 'm.post': true } as any)
        )
      );
      successUploads.forEach((upload) => roomUploadAtomFamily.remove(upload.file));
      setSelectedFiles((items) =>
        items.filter((item) => !successUploads.some((u) => u.file === item.file))
      );
    },
    [mx, postsRoomId, selectedFiles]
  );

  const [createState, create] = useAsyncCallback<void, Error | MatrixError, []>(
    useCallback(async () => {
      if (!postsRoomId) throw new Error('Select a space to share to');

      const plainText = toPlainText(editor.children, isMarkdown).trim();
      const hasText = plainText !== '';
      const hasAttachments = selectedFiles.length > 0;
      const mergeCaptionIntoAttachment = hasText && selectedFiles.length === 1;

      if (!hasText && !hasAttachments) {
        throw new Error('Enter some content or attach a file to share');
      }
      if (hasAttachments && uploadsPending) {
        throw new Error('Wait for attachments to finish uploading');
      }

      let customHtml: string | undefined;
      if (hasText) {
        const html = trimCustomHtml(
          toMatrixCustomHTML(editor.children, {
            allowTextFormatting: true,
            allowBlockMarkdown: isMarkdown,
            allowInlineMarkdown: isMarkdown,
          })
        );
        customHtml = customHtmlEqualsPlainText(html, plainText) ? undefined : html;
      }

      if (hasAttachments) {
        await sendAttachments(
          uploads as UploadSuccess[],
          mergeCaptionIntoAttachment ? { body: plainText, formattedBody: customHtml } : undefined
        );
      }

      if (hasText && !mergeCaptionIntoAttachment) {
        const mentionData = getMentions(mx, postsRoomId, editor);
        const mMentions = getMentionContent(Array.from(mentionData.users), mentionData.room);

        const content: IContent = {
          msgtype: MsgType.Text,
          body: plainText,
          'm.mentions': mMentions,
          'm.post': true,
        };
        if (customHtml) {
          content.format = 'org.matrix.custom.html';
          content.formatted_body = customHtml;
        }

        await mx.sendMessage(postsRoomId, content as any);
      }

      resetEditor(editor);
      resetEditorHistory(editor);
    }, [
      mx,
      postsRoomId,
      editor,
      isMarkdown,
      selectedFiles,
      uploads,
      uploadsPending,
      sendAttachments,
    ])
  );
  const loading = createState.status === AsyncStatus.Loading;
  const error = createState.status === AsyncStatus.Error ? createState.error : undefined;

  const submit = useCallback(() => {
    if (loading) return;
    create().then(() => {
      if (alive()) {
        onCreate?.();
      }
    });
  }, [loading, create, alive, onCreate]);

  // Posts are multi-line by design: plain Enter always inserts a newline
  // (regardless of the chat "enterForNewline" setting) and only mod+Enter submits.
  const handleKeyDown: KeyboardEventHandler = useCallback(
    (evt) => {
      if (isKeyHotkey('mod+enter', evt) && !isComposing(evt)) {
        evt.preventDefault();
        submit();
      }
    },
    [submit, isComposing]
  );

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const handleSpaceSelect = (id: string) => {
    setSpaceId(id);
    setMenuAnchor(undefined);
  };

  const renderRoomAvatar = (room: Room) => (
    <Avatar size="200" radii="400">
      <RoomAvatar
        roomId={room.roomId}
        src={getRoomAvatarUrl(mx, room, 96, useAuthentication)}
        alt={room.name}
        renderFallback={() => (
          <Text as="span" size="H6">
            {nameInitials(room.name)}
          </Text>
        )}
      />
    </Avatar>
  );

  return (
    <Box direction="Column" gap="500">
      <Box shrink="No" direction="Column" gap="100">
        <Text size="L400">Share to</Text>
        <Chip
          type="button"
          variant="SurfaceVariant"
          radii="400"
          before={selectedSpace ? renderRoomAvatar(selectedSpace) : undefined}
          after={<Icon size="100" src={Icons.ChevronBottom} />}
          onClick={handleOpenMenu}
          disabled={loading}
        >
          <Text size="T400" truncate>
            {selectedSpace ? selectedSpace.name : 'Select a space'}
          </Text>
        </Chip>
        <PopOut
          anchor={menuAnchor}
          position="Bottom"
          align="Start"
          content={
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                returnFocusOnDeactivate: false,
                onDeactivate: () => setMenuAnchor(undefined),
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Menu style={{ maxHeight: '30vh', width: toRem(220), overflowY: 'auto' }}>
                <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                  {spaces.length === 0 && (
                    <Text size="T300" style={{ padding: config.space.S200 }}>
                      No spaces available
                    </Text>
                  )}
                  {spaces.map((space) => (
                    <MenuItem
                      key={space.roomId}
                      type="button"
                      size="300"
                      radii="300"
                      variant={space.roomId === spaceId ? 'Success' : 'Surface'}
                      aria-pressed={space.roomId === spaceId}
                      before={renderRoomAvatar(space)}
                      onClick={() => handleSpaceSelect(space.roomId)}
                    >
                      <Text truncate size="T400">
                        {space.name}
                      </Text>
                    </MenuItem>
                  ))}
                </Box>
              </Menu>
            </FocusTrap>
          }
        />
        {selectedRoom && (
          <Text size="T200" priority="300">
            {isPublicRoom
              ? 'This will be shared publicly'
              : 'This will only be visible to members of this room'}
          </Text>
        )}
      </Box>
      <Box grow="Yes" shrink="No" direction="Column" gap="100">
        <Text size="L400">Content</Text>
        {selectedFiles.length > 0 && (
          <Box direction="Column" gap="200" style={{ maxHeight: toRem(240), overflowY: 'auto' }}>
            {selectedFiles.map((fileItem, index) => (
              <UploadCardRenderer
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                isEncrypted={!!fileItem.encInfo}
                fileItem={fileItem}
                setMetadata={handleFileMetadata}
                onRemove={handleRemoveUpload}
              />
            ))}
          </Box>
        )}
        <CustomEditor
          editableName="CreatePost"
          editor={editor}
          placeholder="Share something..."
          maxHeight="30vh"
          onKeyDown={handleKeyDown}
          before={
            <IconButton
              type="button"
              variant="SurfaceVariant"
              size="300"
              radii="300"
              onClick={() => pickFile('*')}
              disabled={!postsRoomId}
              aria-label="Attach media or files"
            >
              <Icon src={Icons.PlusCircle} />
            </IconButton>
          }
          after={
            <IconButton
              type="button"
              variant="SurfaceVariant"
              size="300"
              radii="300"
              onClick={() => setToolbar(!toolbar)}
              aria-pressed={toolbar}
            >
              <Icon size="400" src={toolbar ? Icons.AlphabetUnderline : Icons.Alphabet} />
            </IconButton>
          }
          bottom={
            toolbar && (
              <Box direction="Column">
                <Line variant="SurfaceVariant" size="300" />
                <Toolbar />
              </Box>
            )
          }
        />
        <Text size="T200" priority="300">
          Press Enter for a new line. {isMacOS() ? KeySymbol.Command : 'Ctrl'} + Enter to share.
        </Text>
      </Box>
      {error && (
        <Box style={{ color: color.Critical.Main }} alignItems="Center" gap="200">
          <Icon src={Icons.Warning} filled size="100" />
          <Text size="T300" style={{ color: color.Critical.Main }}>
            <b>
              {error instanceof MatrixError && error.name === ErrorCode.M_LIMIT_EXCEEDED
                ? `Server rate-limited your request for ${millisecondsToMinutes(
                    (error.data.retry_after_ms as number | undefined) ?? 0
                  )} minutes!`
                : error.message}
            </b>
          </Text>
        </Box>
      )}
      <Box shrink="No" direction="Column" gap="200">
        <Button
          type="button"
          size="500"
          variant="Primary"
          radii="400"
          disabled={loading || !postsRoomId || uploadsPending}
          before={loading && <Spinner variant="Primary" fill="Solid" size="200" />}
          onClick={submit}
        >
          <Text size="B500">Share</Text>
        </Button>
      </Box>
    </Box>
  );
}
