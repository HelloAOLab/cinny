import { useCallback } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomNavigate } from '../../hooks/useRoomNavigate';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import {
  getCanonicalAliasOrRoomId,
  getCanonicalAliasRoomId,
  isRoomAlias,
} from '../../utils/matrix';
import { useCommunityOptionally } from '../../pages/app-shell/CommunityContext';
import { APP_COMMUNITY_PATH } from '../../pages/paths';
import {
  getAppCommunityChatRoomPath,
  getAppCommunityPath,
  getAppCommunityPostPath,
} from '../../pages/pathUtils';
import { isPostsRoomName } from '../app-feed/findPostsRoom';
import { getAppRoomTarget } from './appRoomTarget';

/**
 * Opens a room, and optionally an event in it, inside the /app shell: chat
 * rooms open in the community's chat (jumping to the event), and posts rooms
 * open the community feed focused on the post. Rooms the shell has no view
 * for (e.g. DMs) fall back to the main client.
 *
 * Works both inside the shell and outside it (e.g. from a system
 * notification), preferring the community currently open in the URL.
 */
export const useAppRoomNavigate = () => {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const { navigateRoom } = useRoomNavigate();
  const community = useCommunityOptionally();
  const communityMatch = useMatch({ path: APP_COMMUNITY_PATH, end: false });
  const communityIds = useSpaces(mx, allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);

  const urlCommunityIdOrAlias = communityMatch?.params.communityIdOrAlias;
  const openCommunityId =
    community?.roomId ??
    (urlCommunityIdOrAlias && isRoomAlias(urlCommunityIdOrAlias)
      ? getCanonicalAliasRoomId(mx, urlCommunityIdOrAlias)
      : urlCommunityIdOrAlias);

  return useCallback(
    (roomId: string, eventId?: string) => {
      const target = getAppRoomTarget(
        roomId,
        communityIds,
        roomToParents,
        (id) => isPostsRoomName(mx.getRoom(id)?.name),
        openCommunityId,
        eventId
      );
      if (!target) {
        // The shell has no view for rooms outside a community (e.g. DMs).
        navigateRoom(roomId, eventId);
        return;
      }
      const communityIdOrAlias = getCanonicalAliasOrRoomId(mx, target.communityId);
      if (target.kind === 'feed') {
        navigate(
          target.eventId
            ? getAppCommunityPostPath(communityIdOrAlias, target.eventId)
            : getAppCommunityPath(communityIdOrAlias)
        );
        return;
      }
      navigate(
        getAppCommunityChatRoomPath(
          communityIdOrAlias,
          getCanonicalAliasOrRoomId(mx, target.roomId),
          target.eventId
        )
      );
    },
    [mx, navigate, navigateRoom, communityIds, roomToParents, openCommunityId]
  );
};
