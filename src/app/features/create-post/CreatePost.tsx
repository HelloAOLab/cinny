import React, { FormEventHandler, MouseEventHandler, useCallback, useMemo, useState } from 'react';
import { MatrixError, MsgType, Room } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Icon,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Spinner,
  Text,
  TextArea,
  color,
  config,
  toRem,
} from 'folds';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { useAlive } from '../../hooks/useAlive';
import { useFeedRooms } from '../feed';
import { RoomAvatar } from '../../components/room-avatar';
import { nameInitials, millisecondsToMinutes } from '../../utils/common';
import { getRoomAvatarUrl } from '../../utils/room';
import { ErrorCode } from '../../cs-errorcode';
import { stopPropagation } from '../../utils/keyboard';

type CreatePostFormProps = {
  defaultRoomId?: string;
  onCreate?: () => void;
};
export function CreatePostForm({ defaultRoomId, onCreate }: CreatePostFormProps) {
  const mx = useMatrixClient();
  const alive = useAlive();
  const useAuthentication = useMediaAuthentication();
  const feedRoomIds = useFeedRooms();

  const feedRooms = useMemo(
    () =>
      feedRoomIds.map((roomId) => mx.getRoom(roomId)).filter((room): room is Room => room !== null),
    [mx, feedRoomIds]
  );

  const [roomId, setRoomId] = useState<string | undefined>(
    (defaultRoomId && feedRoomIds.includes(defaultRoomId) ? defaultRoomId : undefined) ??
      feedRoomIds[0]
  );
  const selectedRoom = roomId ? mx.getRoom(roomId) : undefined;
  const [text, setText] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const [createState, create] = useAsyncCallback<void, Error | MatrixError, []>(
    useCallback(async () => {
      if (!roomId) throw new Error('Select a room to share to');
      const body = text.trim();
      if (!body) throw new Error('Enter some content to share');
      await mx.sendMessage(roomId, {
        msgtype: MsgType.Text,
        body,
        'm.post': true,
      } as any);
    }, [mx, roomId, text])
  );
  const loading = createState.status === AsyncStatus.Loading;
  const error = createState.status === AsyncStatus.Error ? createState.error : undefined;

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const handleRoomSelect = (id: string) => {
    setRoomId(id);
    setMenuAnchor(undefined);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    if (loading) return;
    create().then(() => {
      if (alive()) {
        onCreate?.();
      }
    });
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
    <Box as="form" onSubmit={handleSubmit} grow="Yes" direction="Column" gap="500">
      <Box shrink="No" direction="Column" gap="100">
        <Text size="L400">Share to</Text>
        <Chip
          type="button"
          variant="SurfaceVariant"
          radii="400"
          before={selectedRoom ? renderRoomAvatar(selectedRoom) : undefined}
          after={<Icon size="100" src={Icons.ChevronBottom} />}
          onClick={handleOpenMenu}
          disabled={loading}
        >
          <Text size="T400" truncate>
            {selectedRoom ? selectedRoom.name : 'Select a room'}
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
                  {feedRooms.length === 0 && (
                    <Text size="T300" style={{ padding: config.space.S200 }}>
                      No rooms available
                    </Text>
                  )}
                  {feedRooms.map((room) => (
                    <MenuItem
                      key={room.roomId}
                      type="button"
                      size="300"
                      radii="300"
                      variant={room.roomId === roomId ? 'Success' : 'Surface'}
                      aria-pressed={room.roomId === roomId}
                      before={renderRoomAvatar(room)}
                      onClick={() => handleRoomSelect(room.roomId)}
                    >
                      <Text truncate size="T400">
                        {room.name}
                      </Text>
                    </MenuItem>
                  ))}
                </Box>
              </Menu>
            </FocusTrap>
          }
        />
      </Box>
      <Box grow="Yes" shrink="No" direction="Column" gap="100">
        <Text size="L400">Content</Text>
        <TextArea
          name="postContent"
          value={text}
          onChange={(evt: React.ChangeEvent<HTMLTextAreaElement>) => setText(evt.target.value)}
          placeholder="Share something..."
          size="500"
          variant="SurfaceVariant"
          radii="400"
          rows={6}
          autoFocus
          required
          disabled={loading}
        />
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
          type="submit"
          size="500"
          variant="Primary"
          radii="400"
          disabled={loading || !roomId || text.trim() === ''}
          before={loading && <Spinner variant="Primary" fill="Solid" size="200" />}
        >
          <Text size="B500">Share</Text>
        </Button>
      </Box>
    </Box>
  );
}
