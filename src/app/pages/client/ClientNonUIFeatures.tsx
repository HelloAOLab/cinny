import { useAtomValue } from 'jotai';
import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomEvent, RoomEventHandlerMap } from 'matrix-js-sdk';
import { roomToUnreadAtom, unreadEqual, unreadInfoToUnread } from '../../state/room/roomToUnread';
import LogoSVG from '../../../../public/res/svg/cinny.svg';
import LogoUnreadSVG from '../../../../public/res/svg/cinny-unread.svg';
import LogoHighlightSVG from '../../../../public/res/svg/cinny-highlight.svg';
import NotificationSound from '../../../../public/sound/notification.ogg';
import InviteSound from '../../../../public/sound/invite.ogg';
import { notificationPermission, setFavicon } from '../../utils/dom';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import { usePreviousValue } from '../../hooks/usePreviousValue';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getInboxInvitesPath } from '../pathUtils';
import {
  getMemberDisplayName,
  getNotificationType,
  getUnreadInfo,
  isNotificationEvent,
} from '../../utils/room';
import { NotificationType, UnreadInfo } from '../../../types/matrix/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import { useSelectedRoom } from '../../hooks/router/useSelectedRoom';
import { useInboxNotificationsSelected } from '../../hooks/router/useInbox';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useAppRoomNavigate } from '../../features/app-inbox/useAppRoomNavigate';
import { isPostsRoomName } from '../../features/app-feed/findPostsRoom';
import { getMessageNotificationBody } from '../../features/app-inbox/notificationBody';

function SystemEmojiFeature() {
  const [twitterEmoji] = useSetting(settingsAtom, 'twitterEmoji');

  if (twitterEmoji) {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji');
  } else {
    document.documentElement.style.setProperty('--font-emoji', 'Twemoji_DISABLED');
  }

  return null;
}

function PageZoomFeature() {
  const [pageZoom] = useSetting(settingsAtom, 'pageZoom');

  if (pageZoom === 100) {
    document.documentElement.style.removeProperty('font-size');
  } else {
    document.documentElement.style.setProperty('font-size', `calc(1em * ${pageZoom / 100})`);
  }

  return null;
}

function FaviconUpdater() {
  const roomToUnread = useAtomValue(roomToUnreadAtom);

  useEffect(() => {
    let notification = false;
    let highlight = false;
    roomToUnread.forEach((unread) => {
      if (unread.total > 0) {
        notification = true;
      }
      if (unread.highlight > 0) {
        highlight = true;
      }
    });

    if (notification) {
      setFavicon(highlight ? LogoHighlightSVG : LogoUnreadSVG);
    } else {
      setFavicon(LogoSVG);
    }
  }, [roomToUnread]);

  return null;
}

function InviteNotifications() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const invites = useAtomValue(allInvitesAtom);
  const perviousInviteLen = usePreviousValue(invites.length, 0);
  const mx = useMatrixClient();

  const navigate = useNavigate();
  const [showNotifications] = useSetting(settingsAtom, 'showNotifications');
  const [notificationSound] = useSetting(settingsAtom, 'isNotificationSounds');

  const notify = useCallback(
    (count: number) => {
      const noti = new window.Notification('Invitation', {
        icon: LogoSVG,
        badge: LogoSVG,
        body: `You have ${count} new invitation request.`,
        silent: true,
      });

      noti.onclick = () => {
        if (!window.closed) navigate(getInboxInvitesPath());
        noti.close();
      };
    },
    [navigate]
  );

  const playSound = useCallback(() => {
    const audioElement = audioRef.current;
    audioElement?.play();
  }, []);

  useEffect(() => {
    if (invites.length > perviousInviteLen && mx.getSyncState() === 'SYNCING') {
      if (showNotifications && notificationPermission('granted')) {
        notify(invites.length - perviousInviteLen);
      }

      if (notificationSound) {
        playSound();
      }
    }
  }, [mx, invites, perviousInviteLen, showNotifications, notificationSound, notify, playSound]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio ref={audioRef} style={{ display: 'none' }}>
      <source src={InviteSound} type="audio/ogg" />
    </audio>
  );
}

function MessageNotifications() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const notifRef = useRef<Notification>();
  const unreadCacheRef = useRef<Map<string, UnreadInfo>>(new Map());
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [showNotifications] = useSetting(settingsAtom, 'showNotifications');
  const [notificationSound] = useSetting(settingsAtom, 'isNotificationSounds');

  const openRoom = useAppRoomNavigate();
  const notificationSelected = useInboxNotificationsSelected();
  const selectedRoomId = useSelectedRoom();

  // Kept in a ref so a notification that's already showing opens the room
  // with the latest room/community state when clicked.
  const openRoomRef = useRef(openRoom);
  openRoomRef.current = openRoom;

  const notify = useCallback(
    ({
      roomName,
      roomAvatar,
      body,
      roomId,
      eventId,
    }: {
      roomName: string;
      roomAvatar?: string;
      body: string;
      roomId: string;
      eventId: string;
    }) => {
      const noti = new window.Notification(roomName, {
        icon: roomAvatar,
        badge: roomAvatar,
        body,
        silent: true,
      });

      noti.onclick = () => {
        if (!window.closed) {
          window.focus();
          // Jump straight to the event: the post (or comment) in the
          // community feed, or the message in the chat room.
          openRoomRef.current(roomId, eventId);
        }
        noti.close();
        notifRef.current = undefined;
      };

      notifRef.current?.close();
      notifRef.current = noti;
    },
    []
  );

  const playSound = useCallback(() => {
    const audioElement = audioRef.current;
    audioElement?.play();
  }, []);

  useEffect(() => {
    const handleTimelineEvent: RoomEventHandlerMap[RoomEvent.Timeline] = (
      mEvent,
      room,
      toStartOfTimeline,
      removed,
      data
    ) => {
      if (mx.getSyncState() !== 'SYNCING') return;
      if (document.hasFocus() && (selectedRoomId === room?.roomId || notificationSelected)) return;
      if (
        !room ||
        !data.liveEvent ||
        room.isSpaceRoom() ||
        !isNotificationEvent(mEvent) ||
        getNotificationType(mx, room.roomId) === NotificationType.Mute
      ) {
        return;
      }

      const sender = mEvent.getSender();
      const eventId = mEvent.getId();
      if (!sender || !eventId || mEvent.getSender() === mx.getUserId()) return;
      const unreadInfo = getUnreadInfo(room);
      const cachedUnreadInfo = unreadCacheRef.current.get(room.roomId);
      unreadCacheRef.current.set(room.roomId, unreadInfo);

      if (unreadInfo.total === 0) return;
      if (
        cachedUnreadInfo &&
        unreadEqual(unreadInfoToUnread(cachedUnreadInfo), unreadInfoToUnread(unreadInfo))
      ) {
        return;
      }

      if (showNotifications && notificationPermission('granted')) {
        const avatarMxc =
          room.getAvatarFallbackMember()?.getMxcAvatarUrl() ?? room.getMxcAvatarUrl();
        const username = getMemberDisplayName(room, sender) ?? getMxIdLocalPart(sender) ?? sender;
        const body = getMessageNotificationBody(username, {
          mentioned: !!mx.getPushActionsForEvent(mEvent)?.tweaks?.highlight,
          inPostsRoom: isPostsRoomName(room.name),
        });
        notify({
          roomName: room.name ?? 'Unknown',
          roomAvatar: avatarMxc
            ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 96, 96, 'crop') ?? undefined
            : undefined,
          body,
          roomId: room.roomId,
          eventId,
        });
      }

      if (notificationSound) {
        playSound();
      }
    };
    mx.on(RoomEvent.Timeline, handleTimelineEvent);
    return () => {
      mx.removeListener(RoomEvent.Timeline, handleTimelineEvent);
    };
  }, [
    mx,
    notificationSound,
    notificationSelected,
    showNotifications,
    playSound,
    notify,
    selectedRoomId,
    useAuthentication,
  ]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <audio ref={audioRef} style={{ display: 'none' }}>
      <source src={NotificationSound} type="audio/ogg" />
    </audio>
  );
}

type ClientNonUIFeaturesProps = {
  children: ReactNode;
};

export function ClientNonUIFeatures({ children }: ClientNonUIFeaturesProps) {
  return (
    <>
      <SystemEmojiFeature />
      <PageZoomFeature />
      <FaviconUpdater />
      <InviteNotifications />
      <MessageNotifications />
      {children}
    </>
  );
}
