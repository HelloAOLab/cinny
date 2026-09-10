import React from 'react';
import { Box, Icon, Icons } from 'folds';
import { PageHero, PageHeroEmpty, PageHeroSection } from '../../components/page';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { useFeedPosts } from './useFeedPosts';
import { FeedPostCard } from './FeedPostCard';

type FeedProps = {
  rooms: string[];
};

export function Feed({ rooms }: FeedProps) {
  const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
  const [urlPreview] = useSetting(settingsAtom, 'urlPreview');

  const posts = useFeedPosts(rooms);

  if (posts.length === 0) {
    return (
      <PageHeroEmpty>
        <PageHeroSection>
          <PageHero
            icon={<Icon size="600" src={Icons.Photo} />}
            title="No Posts Yet"
            subTitle="Posts shared in your rooms will show up here."
          />
        </PageHeroSection>
      </PageHeroEmpty>
    );
  }

  return (
    <Box direction="Column" gap="400">
      {posts.map((post) => (
        <FeedPostCard
          key={post.event.getId()}
          room={post.room}
          event={post.event}
          mediaAutoLoad={mediaAutoLoad}
          urlPreview={urlPreview}
        />
      ))}
    </Box>
  );
}
