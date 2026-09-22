import React from 'react';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { useFeedPosts } from '../feed/useFeedPosts';
import { usePostsRoom } from './usePostsRoom';
import { AppPostCard } from './AppPostCard';
import * as css from './AppFeedScreen.css';

const PLAY_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1596ce">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export function AppFeedScreen() {
  const community = useCommunity();
  const postsRoom = usePostsRoom(community);
  const posts = useFeedPosts(postsRoom ? [postsRoom.roomId] : []);

  if (!postsRoom) {
    return (
      <AppEmptyState
        title="No posts room yet"
        subtitle={`${community.name} doesn't have a room ending in "-posts" yet.`}
      />
    );
  }

  return (
    <>
      <div className={css.Stories}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={css.StoryTile}>
            <span className={css.StoryPlayButton}>{PLAY_ICON}</span>
          </div>
        ))}
      </div>

      {posts.length === 0 ? (
        <AppEmptyState
          title="No posts yet"
          subtitle={`Posts shared in ${postsRoom.name} will show up here.`}
        />
      ) : (
        <div className={css.Posts}>
          {posts.map((post) => (
            <AppPostCard key={post.event.getId()} room={post.room} event={post.event} />
          ))}
        </div>
      )}
    </>
  );
}
