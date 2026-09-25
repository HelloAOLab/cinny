import React, { ChangeEvent, FormEvent, ReactNode, useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Room, SearchOrderBy } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useRoomNavigate } from '../../hooks/useRoomNavigate';
import { useDebounce } from '../../hooks/useDebounce';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { getCanonicalAliasOrRoomId } from '../../utils/matrix';
import { getMemberDisplayName, getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { relativeTime } from '../../utils/time';
import { useCommunityOptionally } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { SearchIcon } from '../../pages/app-shell/AppIcons';
import { getAppCommunityChatRoomPath, getAppCommunityPath } from '../../pages/pathUtils';
import { ResultItem, useMessageSearch } from '../message-search/useMessageSearch';
import { isPostsRoomName } from '../app-feed/findPostsRoom';
import { getMessagePreview } from '../app-chat/chatRooms';
import { POST_TYPE_OPTIONS, getPostType } from '../create-post/postType';
import { groupAppSearchResults, splitHighlights } from './appSearchResults';
import * as css from './AppSearch.css';

const TERM_PARAM = 'term';

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  const parts = useMemo(() => splitHighlights(text, highlights), [text, highlights]);
  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          // Parts never reorder, so their index is a stable key.
          // eslint-disable-next-line react/no-array-index-key
          <mark key={index} className={css.Highlight}>
            {part.text}
          </mark>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <React.Fragment key={index}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

type SearchResultCardProps = {
  item: ResultItem;
  highlights: string[];
  /** Shown for chat matches so it's clear which room they came from. */
  showRoomName?: boolean;
  onOpen: (item: ResultItem) => void;
};

function SearchResultCard({ item, highlights, showRoomName, onOpen }: SearchResultCardProps) {
  const mx = useMatrixClient();
  const { event } = item;
  const room = mx.getRoom(event.room_id);
  const senderName = (room && getMemberDisplayName(room, event.sender)) ?? event.sender;
  const content = event.content as Record<string, unknown>;
  const body = getMessagePreview({ type: event.type, content }) ?? '';
  const postType = getPostType(content);
  const postTypeLabel = POST_TYPE_OPTIONS.find((option) => option.value === postType)?.label;
  const isComment = !showRoomName && content['m.post'] !== true;

  return (
    <button type="button" className={css.ResultItem} onClick={() => onOpen(item)}>
      <span className={css.ResultMeta}>
        <span className={css.ResultSender}>{senderName}</span>
        {showRoomName && room && <span className={css.ResultRoom}>in {room.name}</span>}
        {postTypeLabel && <span className={css.ResultTag}>{postTypeLabel}</span>}
        {isComment && <span className={css.ResultTag}>Comment</span>}
        <span className={css.ResultTime}>{relativeTime(event.origin_server_ts)}</span>
      </span>
      {body && (
        <span className={css.ResultBody}>
          <HighlightedText text={body} highlights={highlights} />
        </span>
      )}
    </button>
  );
}

type ResultSectionProps = {
  title: string;
  items: ResultItem[];
  highlights: string[];
  showRoomName?: boolean;
  onOpen: (item: ResultItem) => void;
};

function ResultSection({ title, items, highlights, showRoomName, onOpen }: ResultSectionProps) {
  if (items.length === 0) return null;
  return (
    <section className={css.Section}>
      <span className={css.SectionTitle}>{title}</span>
      {items.map((item) => (
        <SearchResultCard
          key={item.event.event_id}
          item={item}
          highlights={highlights}
          showRoomName={showRoomName}
          onOpen={onOpen}
        />
      ))}
    </section>
  );
}

function CommunityGroupHeader({ community }: { community: Room }) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const avatarUrl = getRoomAvatarUrl(mx, community, 96, useAuthentication);
  return (
    <div className={css.CommunityHeader}>
      <span className={css.CommunityAvatar}>
        {avatarUrl ? (
          <img className={css.CommunityAvatarImage} src={avatarUrl} alt="" />
        ) : (
          nameInitials(community.name, 2)
        )}
      </span>
      <span className={css.CommunityName}>{community.name}</span>
    </div>
  );
}

/**
 * Searches the user's posts and chats from inside the /app shell. Matches are
 * grouped by community, with each community's posts listed before its chats;
 * rooms outside every community (e.g. DMs) come last.
 */
export function AppSearchScreen() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const { navigateRoom } = useRoomNavigate();
  const community = useCommunityOptionally();
  const communityIds = useSpaces(mx, allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const term = searchParams.get(TERM_PARAM)?.trim() || undefined;
  const [inputValue, setInputValue] = useState(term ?? '');

  const setTerm = useCallback(
    (value: string) => {
      setSearchParams(
        (prevParams) => {
          const newParams = new URLSearchParams(prevParams);
          const trimmed = value.trim();
          if (trimmed) newParams.set(TERM_PARAM, trimmed);
          else newParams.delete(TERM_PARAM);
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const setTermDebounced = useDebounce(setTerm, { wait: 400 });

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setInputValue(evt.target.value);
    setTermDebounced(evt.target.value);
  };
  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setTerm(inputValue);
  };
  const handleClear = () => {
    setInputValue('');
    // Also supersede any pending debounced update, which would restore the term.
    setTermDebounced('');
    setTerm('');
  };

  const searchMessages = useMessageSearch({ term, order: SearchOrderBy.Recent });
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    enabled: !!term,
    queryKey: ['app-search', term],
    queryFn: ({ pageParam }) => searchMessages(pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextToken,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.groups.flatMap((group) => group.items)) ?? [],
    [data]
  );
  const highlights = useMemo(() => {
    const terms = data?.pages.flatMap((page) => page.highlights) ?? [];
    return Array.from(new Set(term ? [term, ...terms] : terms));
  }, [data, term]);

  const grouped = useMemo(
    () =>
      groupAppSearchResults(
        items,
        (item) => item.event.room_id,
        communityIds,
        roomToParents,
        (roomId) => isPostsRoomName(mx.getRoom(roomId)?.name),
        community?.roomId
      ),
    [mx, items, communityIds, roomToParents, community]
  );

  const openResult = useCallback(
    (item: ResultItem) => {
      const roomId = item.event.room_id;
      const group = grouped.communities.find(
        (g) => g.posts.includes(item) || g.chats.includes(item)
      );
      if (!group) {
        // The shell has no view for rooms outside a community (e.g. DMs).
        navigateRoom(roomId, item.event.event_id);
        return;
      }
      const communityIdOrAlias = getCanonicalAliasOrRoomId(mx, group.communityId);
      if (group.posts.includes(item)) {
        navigate(getAppCommunityPath(communityIdOrAlias));
        return;
      }
      navigate(
        getAppCommunityChatRoomPath(communityIdOrAlias, getCanonicalAliasOrRoomId(mx, roomId))
      );
    },
    [mx, navigate, navigateRoom, grouped]
  );

  let content: ReactNode;
  if (!term) {
    content = (
      <AppEmptyState
        title="Search posts and chats"
        subtitle="Find posts and messages across your communities. Encrypted chats can't be searched."
      />
    );
  } else if (status === 'pending') {
    content = <AppEmptyState title="Searching…" />;
  } else if (status === 'error') {
    content = (
      <AppEmptyState
        title="Search failed"
        subtitle="Something went wrong while searching. Please try again."
      />
    );
  } else if (items.length === 0) {
    content = (
      <AppEmptyState
        title="No results"
        subtitle={`Nothing in your posts or chats matches "${term}".`}
      />
    );
  } else {
    content = (
      <div className={css.Results}>
        {grouped.communities.map((group) => {
          const groupCommunity = mx.getRoom(group.communityId);
          if (!groupCommunity) return null;
          return (
            <div key={group.communityId} className={css.CommunityGroup}>
              <CommunityGroupHeader community={groupCommunity} />
              <ResultSection
                title="Posts"
                items={group.posts}
                highlights={highlights}
                onOpen={openResult}
              />
              <ResultSection
                title="Chats"
                items={group.chats}
                highlights={highlights}
                showRoomName
                onOpen={openResult}
              />
            </div>
          );
        })}
        {grouped.otherChats.length > 0 && (
          <div className={css.CommunityGroup}>
            <ResultSection
              title="Other chats"
              items={grouped.otherChats}
              highlights={highlights}
              showRoomName
              onOpen={openResult}
            />
          </div>
        )}
        {hasNextPage && (
          <div className={css.Footer}>
            <button
              type="button"
              className={css.LoadMoreButton}
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more results'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={css.Screen}>
      <form className={css.SearchBar} role="search" onSubmit={handleSubmit}>
        <div className={css.SearchField}>
          <SearchIcon size={20} />
          <input
            className={css.SearchInput}
            type="search"
            aria-label="Search posts and chats"
            placeholder="Search posts and chats"
            value={inputValue}
            onChange={handleChange}
            // The page exists to search, so start typing right away.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          {inputValue && (
            <button type="button" className={css.ClearButton} onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </form>
      {content}
    </div>
  );
}
