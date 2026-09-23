import React from 'react';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { useAppOutletContext } from '../../pages/app-shell/AppOutletContext';
import { POST_TYPE_OPTIONS, filterPostsByType } from '../create-post/postType';
import { useFeedPosts } from '../feed/useFeedPosts';
import { usePostsRoom } from './usePostsRoom';
import { AppPostCard } from './AppPostCard';
import * as css from './AppFeedScreen.css';

export function AppFeedScreen() {
  const community = useCommunity();
  const postsRoom = usePostsRoom(community);
  const { postTypeFilter } = useAppOutletContext();
  const allPosts = useFeedPosts(postsRoom ? [postsRoom.roomId] : []);
  const posts = filterPostsByType(allPosts, postTypeFilter);

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
        />
      ))}
    </div>
  );
}
