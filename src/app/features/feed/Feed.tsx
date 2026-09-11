import React, { useMemo, useState } from 'react';
import { Box, Icon, Icons, Overlay, OverlayBackdrop } from 'folds';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import FocusTrap from 'focus-trap-react';
import { PageHero, PageHeroEmpty, PageHeroSection } from '../../components/page';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { stopPropagation } from '../../utils/keyboard';
import { useFeedPosts } from './useFeedPosts';
import { groupFeedPosts } from './groupFeedPosts';
import { FeedPostCard } from './FeedPostCard';
import { CommentsPanel } from './comments/CommentsPanel';

type FeedProps = {
  rooms: string[];
};

export function Feed({ rooms }: FeedProps) {
  const [mediaAutoLoad] = useSetting(settingsAtom, 'mediaAutoLoad');
  const [urlPreview] = useSetting(settingsAtom, 'urlPreview');
  const [commentsTarget, setCommentsTarget] = useState<{ room: Room; event: MatrixEvent }>();

  const posts = useFeedPosts(rooms);
  const postGroups = useMemo(() => groupFeedPosts(posts), [posts]);

  const handleOpenComments = (room: Room, event: MatrixEvent) => setCommentsTarget({ room, event });
  const handleCloseComments = () => setCommentsTarget(undefined);

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
      {postGroups.map((group) => (
        <FeedPostCard
          key={group.posts[0].event.getId()}
          room={group.room}
          events={group.posts.map((post) => post.event)}
          mediaAutoLoad={mediaAutoLoad}
          urlPreview={urlPreview}
          onOpenComments={handleOpenComments}
        />
      ))}
      <Overlay open={!!commentsTarget} backdrop={<OverlayBackdrop />}>
        <Box style={{ height: '100%' }} justifyContent="End">
          {commentsTarget && (
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                returnFocusOnDeactivate: false,
                onDeactivate: handleCloseComments,
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <CommentsPanel
                room={commentsTarget.room}
                postEvent={commentsTarget.event}
                requestClose={handleCloseComments}
              />
            </FocusTrap>
          )}
        </Box>
      </Overlay>
    </Box>
  );
}
