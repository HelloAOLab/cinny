import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { useAppOutletContext } from '../../pages/app-shell/AppOutletContext';
import { POST_TYPE_OPTIONS, filterPostsByType } from '../create-post/postType';
import { useFeedPosts } from '../feed/useFeedPosts';
import { usePostsRoom } from './usePostsRoom';
import { useFocusedPost } from './useFocusedPost';
import { AppPostCard } from './AppPostCard';
import { AppCommentsSheet } from './AppCommentsSheet';
import * as css from './AppFeedScreen.css';

export function AppFeedScreen() {
  const community = useCommunity();
  const postsRoom = usePostsRoom(community);
  const { postTypeFilter } = useAppOutletContext();
  const allPosts = useFeedPosts(postsRoom ? [postsRoom.roomId] : []);
  const filteredPosts = filterPostsByType(allPosts, postTypeFilter);
  const [commentsTarget, setCommentsTarget] = useState<{ room: Room; event: MatrixEvent }>();

  // A linked event (e.g. from a notification) focuses its post, and opens the
  // post's comments when the event was a comment.
  const { eventId } = useParams();
  const focused = useFocusedPost(postsRoom, eventId);
  const focusedPost = focused?.post;

  // The linked post may be older than the loaded history, or hidden by the
  // type filter; keep it on top so the link always lands somewhere.
  const posts =
    postsRoom && focusedPost && !filteredPosts.some((post) => post.event.getId() === focused.postId)
      ? [{ room: postsRoom, event: focusedPost }, ...filteredPosts]
      : filteredPosts;

  const openedCommentsFor = useRef<string>();
  useEffect(() => {
    if (!postsRoom || !focused?.isComment || !focusedPost || !eventId) return;
    if (openedCommentsFor.current === eventId) return;
    openedCommentsFor.current = eventId;
    setCommentsTarget({ room: postsRoom, event: focusedPost });
  }, [postsRoom, focused, focusedPost, eventId]);

  if (!postsRoom) {
    return (
      <AppEmptyState
        title="No posts room yet"
        subtitle={`${community.name} doesn't have a room ending in "-posts" yet.`}
      />
    );
  }

  if (posts.length === 0) {
    const filterLabel = POST_TYPE_OPTIONS.find((option) => option.value === postTypeFilter)?.label;
    if (filterLabel) {
      return (
        <AppEmptyState
          title={`No ${filterLabel} posts yet`}
          subtitle={`${filterLabel} posts shared in ${postsRoom.name} will show up here.`}
        />
      );
    }
    return (
      <AppEmptyState
        title="No posts yet"
        subtitle={`Posts shared in ${postsRoom.name} will show up here.`}
      />
    );
  }

  return (
    <div className={css.Posts}>
      {posts.map((post) => (
        <AppPostCard
          key={post.event.getId()}
          room={post.room}
          event={post.event}
          community={community}
          focused={!!focused && post.event.getId() === focused.postId}
          onOpenComments={(room, event) => setCommentsTarget({ room, event })}
        />
      ))}
      {commentsTarget && (
        <AppCommentsSheet
          room={commentsTarget.room}
          postEvent={commentsTarget.event}
          onClose={() => setCommentsTarget(undefined)}
        />
      )}
    </div>
  );
}
