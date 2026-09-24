import { generatePath, Path } from 'react-router-dom';
import {
  DIRECT_CREATE_PATH,
  DIRECT_PATH,
  DIRECT_ROOM_PATH,
  EXPLORE_FEATURED_PATH,
  EXPLORE_PATH,
  EXPLORE_SERVER_PATH,
  HOME_CREATE_PATH,
  HOME_JOIN_PATH,
  HOME_PATH,
  HOME_ROOM_PATH,
  HOME_SEARCH_PATH,
  HOME_FEED_PATH,
  APP_PATH,
  APP_COMMUNITY_PATH,
  APP_COMMUNITY_CHAT_PATH,
  APP_COMMUNITY_CHAT_ROOM_PATH,
  APP_COMMUNITY_SETTINGS_PATH,
  APP_COMMUNITY_POST_PATH,
  APP_COMMUNITY_INBOX_PATH,
  APP_INBOX_PATH,
  APP_LOGIN_PATH,
  APP_REGISTER_PATH,
  LOGIN_PATH,
  INBOX_INVITES_PATH,
  INBOX_NOTIFICATIONS_PATH,
  INBOX_PATH,
  REGISTER_PATH,
  RESET_PASSWORD_PATH,
  ROOT_PATH,
  SPACE_LOBBY_PATH,
  SPACE_PATH,
  SPACE_ROOM_PATH,
  SPACE_SEARCH_PATH,
  SPACE_FEED_PATH,
  CREATE_PATH,
} from './paths';
import { trimLeadingSlash, trimTrailingSlash } from '../utils/common';
import { HashRouterConfig } from '../hooks/useClientConfig';

export const joinPathComponent = (path: Path): string => path.pathname + path.search + path.hash;

export const withSearchParam = <T extends Record<string, string>>(
  path: string,
  searchParam: T
): string => {
  const params = new URLSearchParams(searchParam);

  return `${path}?${params}`;
};
export const encodeSearchParamValueArray = (ids: string[]): string => ids.join(',');
export const decodeSearchParamValueArray = (idsParam: string): string[] => idsParam.split(',');

export const getOriginBaseUrl = (hashRouterConfig?: HashRouterConfig): string => {
  const baseUrl = `${trimTrailingSlash(window.location.origin)}${import.meta.env.BASE_URL}`;

  if (hashRouterConfig?.enabled) {
    return `${trimTrailingSlash(baseUrl)}/#${hashRouterConfig.basename}`;
  }

  return baseUrl;
};

export const withOriginBaseUrl = (baseUrl: string, path: string): string =>
  `${trimTrailingSlash(baseUrl)}${path}`;

export const getAppPathFromHref = (baseUrl: string, href: string): string => {
  // if hash is in baseUrl means we are using hashRouter
  const baseHashIndex = baseUrl.indexOf('#');
  if (baseHashIndex > -1) {
    const hrefHashIndex = href.indexOf('#');
    // href may/not have "/" around "#"
    // we need to take care of this when extracting app path
    const trimmedBaseUrl = trimLeadingSlash(baseUrl.slice(baseHashIndex + 1));
    const trimmedHref = trimLeadingSlash(href.slice(hrefHashIndex + 1));

    const appPath = trimmedHref.slice(trimmedBaseUrl.length);
    return `/${trimLeadingSlash(appPath)}`;
  }

  return href.slice(trimTrailingSlash(baseUrl).length);
};

export const getRootPath = (): string => ROOT_PATH;

export const getLoginPath = (server?: string): string => {
  const params = server ? { server: encodeURIComponent(server) } : undefined;
  return generatePath(LOGIN_PATH, params);
};

export const getRegisterPath = (server?: string): string => {
  const params = server ? { server: encodeURIComponent(server) } : undefined;
  return generatePath(REGISTER_PATH, params);
};

export const getResetPasswordPath = (server?: string): string => {
  const params = server ? { server: encodeURIComponent(server) } : undefined;
  return generatePath(RESET_PASSWORD_PATH, params);
};

export const getHomePath = (): string => HOME_PATH;
export const getHomeCreatePath = (): string => HOME_CREATE_PATH;
export const getHomeJoinPath = (): string => HOME_JOIN_PATH;
export const getHomeSearchPath = (): string => HOME_SEARCH_PATH;
export const getHomeFeedPath = (): string => HOME_FEED_PATH;
export const getHomeRoomPath = (roomIdOrAlias: string, eventId?: string): string => {
  const params = {
    roomIdOrAlias: encodeURIComponent(roomIdOrAlias),
    eventId: eventId ? encodeURIComponent(eventId) : null,
  };

  return generatePath(HOME_ROOM_PATH, params);
};

export const getDirectPath = (): string => DIRECT_PATH;
export const getDirectCreatePath = (): string => DIRECT_CREATE_PATH;
export const getDirectRoomPath = (roomIdOrAlias: string, eventId?: string): string => {
  const params = {
    roomIdOrAlias: encodeURIComponent(roomIdOrAlias),
    eventId: eventId ? encodeURIComponent(eventId) : null,
  };

  return generatePath(DIRECT_ROOM_PATH, params);
};

export const getSpacePath = (spaceIdOrAlias: string): string => {
  const params = {
    spaceIdOrAlias: encodeURIComponent(spaceIdOrAlias),
  };

  return generatePath(SPACE_PATH, params);
};
export const getSpaceLobbyPath = (spaceIdOrAlias: string): string => {
  const params = {
    spaceIdOrAlias: encodeURIComponent(spaceIdOrAlias),
  };
  return generatePath(SPACE_LOBBY_PATH, params);
};
export const getSpaceSearchPath = (spaceIdOrAlias: string): string => {
  const params = {
    spaceIdOrAlias: encodeURIComponent(spaceIdOrAlias),
  };
  return generatePath(SPACE_SEARCH_PATH, params);
};
export const getSpaceFeedPath = (spaceIdOrAlias: string): string => {
  const params = {
    spaceIdOrAlias: encodeURIComponent(spaceIdOrAlias),
  };
  return generatePath(SPACE_FEED_PATH, params);
};
export const getSpaceRoomPath = (
  spaceIdOrAlias: string,
  roomIdOrAlias: string,
  eventId?: string
): string => {
  const params = {
    spaceIdOrAlias: encodeURIComponent(spaceIdOrAlias),
    roomIdOrAlias: encodeURIComponent(roomIdOrAlias),
    eventId: eventId ? encodeURIComponent(eventId) : null,
  };

  return generatePath(SPACE_ROOM_PATH, params);
};

export const getExplorePath = (): string => EXPLORE_PATH;
export const getExploreFeaturedPath = (): string => EXPLORE_FEATURED_PATH;
export const getExploreServerPath = (server: string): string => {
  const params = {
    server: encodeURIComponent(server),
  };
  return generatePath(EXPLORE_SERVER_PATH, params);
};

export const getCreatePath = (): string => CREATE_PATH;

export const getInboxPath = (): string => INBOX_PATH;
export const getInboxNotificationsPath = (): string => INBOX_NOTIFICATIONS_PATH;
export const getInboxInvitesPath = (): string => INBOX_INVITES_PATH;

export const getAppPath = (): string => APP_PATH;
export const getAppCommunityPath = (communityIdOrAlias: string): string => {
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
  };
  return generatePath(APP_COMMUNITY_PATH, params);
};
export const getAppCommunityChatPath = (communityIdOrAlias: string): string => {
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
  };
  return generatePath(APP_COMMUNITY_CHAT_PATH, params);
};
export const getAppCommunityChatRoomPath = (
  communityIdOrAlias: string,
  roomIdOrAlias: string,
  eventId?: string
): string => {
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
    roomIdOrAlias: encodeURIComponent(roomIdOrAlias),
    eventId: eventId ? encodeURIComponent(eventId) : null,
  };
  return generatePath(APP_COMMUNITY_CHAT_ROOM_PATH, params);
};
/**
 * A single event in a community's feed: a post, or a comment on one (the feed
 * then opens that post's comments).
 */
export const getAppCommunityPostPath = (communityIdOrAlias: string, eventId: string): string => {
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
    eventId: encodeURIComponent(eventId),
  };
  return generatePath(APP_COMMUNITY_POST_PATH, params);
};
export const getAppCommunitySettingsPath = (communityIdOrAlias: string): string => {
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
  };
  return generatePath(APP_COMMUNITY_SETTINGS_PATH, params);
};
/**
 * The inbox inside the /app shell, scoped to a community when one is open so
 * the shell keeps its Home/Chat navigation for it.
 */
export const getAppInboxPath = (communityIdOrAlias?: string): string => {
  if (!communityIdOrAlias) return APP_INBOX_PATH;
  const params = {
    communityIdOrAlias: encodeURIComponent(communityIdOrAlias),
  };
  return generatePath(APP_COMMUNITY_INBOX_PATH, params);
};
export const getAppLoginPath = (server?: string): string => {
  const params = server ? { server: encodeURIComponent(server) } : undefined;
  return generatePath(APP_LOGIN_PATH, params);
};
export const getAppRegisterPath = (server?: string): string => {
  const params = server ? { server: encodeURIComponent(server) } : undefined;
  return generatePath(APP_REGISTER_PATH, params);
};

/**
 * Picks the login page for a visitor who isn't signed in. The /app shell is
 * the default; only a visitor bounced from a legacy client URL (e.g. /home/)
 * is sent to the legacy login page.
 */
export const getLoginPathForRedirect = (afterLoginPath?: string): string => {
  const pathname = afterLoginPath?.split(/[?#]/)[0] ?? ROOT_PATH;
  if (pathname === ROOT_PATH || pathname.startsWith(APP_PATH)) return getAppLoginPath();
  return getLoginPath();
};
