import { RoomToParents } from '../../../types/matrix/room';
import { getAppRoomTarget } from '../app-inbox/appRoomTarget';

/** A community's matches: posts (from its posts room) first, then chats. */
export type AppSearchCommunityGroup<T> = {
  communityId: string;
  posts: T[];
  chats: T[];
};

export type AppSearchGroups<T> = {
  communities: AppSearchCommunityGroup<T>[];
  /** Matches in rooms outside every joined community, such as DMs. */
  otherChats: T[];
};

/**
 * Groups search matches the way the /app shell's search page lists them: by
 * community, then posts before chats. Matches keep their incoming (server)
 * order within each list, and communities are ordered by their first match,
 * except that `preferredCommunityId` (the one currently open) comes first.
 */
export const groupAppSearchResults = <T>(
  items: T[],
  getRoomId: (item: T) => string,
  communityIds: string[],
  roomToParents: RoomToParents,
  isPostsRoom: (roomId: string) => boolean,
  preferredCommunityId?: string
): AppSearchGroups<T> => {
  const groups = new Map<string, AppSearchCommunityGroup<T>>();
  const otherChats: T[] = [];

  items.forEach((item) => {
    const target = getAppRoomTarget(
      getRoomId(item),
      communityIds,
      roomToParents,
      isPostsRoom,
      preferredCommunityId
    );
    if (!target) {
      otherChats.push(item);
      return;
    }
    let group = groups.get(target.communityId);
    if (!group) {
      group = { communityId: target.communityId, posts: [], chats: [] };
      groups.set(target.communityId, group);
    }
    if (target.kind === 'feed') group.posts.push(item);
    else group.chats.push(item);
  });

  const communities = Array.from(groups.values());
  const preferredIndex = communities.findIndex((g) => g.communityId === preferredCommunityId);
  if (preferredIndex > 0) communities.unshift(...communities.splice(preferredIndex, 1));

  return { communities, otherChats };
};

export type HighlightPart = { text: string; match: boolean };

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits text into plain and highlighted parts for the given search
 * highlights (matched case-insensitively), so matches can be emphasised.
 */
export const splitHighlights = (text: string, highlights: string[]): HighlightPart[] => {
  const terms = highlights.filter((term) => term.trim().length > 0);
  if (!text || terms.length === 0) return text ? [{ text, match: false }] : [];

  // Longer terms first, so a term isn't cut short by one of its prefixes.
  const pattern = [...terms]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');

  return text
    .split(regex)
    .map((part, index) => ({ text: part, match: index % 2 === 1 }))
    .filter((part) => part.text.length > 0);
};
