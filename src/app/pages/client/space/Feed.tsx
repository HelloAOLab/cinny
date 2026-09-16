import React, { useRef } from 'react';
import { Box, Icon, Icons, Text, Scroll, IconButton, Button } from 'folds';
import { Page, PageContent, PageContentCenter, PageHeader } from '../../../components/page';
import { Feed, useSpaceFeedRooms } from '../../../features/feed';
import { useOpenCreatePostModal } from '../../../state/hooks/createPostModal';
import { useSpace } from '../../../hooks/useSpace';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { BackRouteHandler } from '../../../components/BackRouteHandler';
import * as css from './Feed.css';

export function SpaceFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const space = useSpace();
  const rooms = useSpaceFeedRooms(space.roomId);
  const screenSize = useScreenSizeContext();
  const openCreatePostModal = useOpenCreatePostModal();

  return (
    <Page>
      <PageHeader balance>
        <Box grow="Yes" alignItems="Center" gap="200">
          <Box grow="Yes" basis="No">
            {screenSize === ScreenSize.Mobile && (
              <BackRouteHandler>
                {(onBack) => (
                  <IconButton onClick={onBack}>
                    <Icon src={Icons.ArrowLeft} />
                  </IconButton>
                )}
              </BackRouteHandler>
            )}
          </Box>
          <Box justifyContent="Center" alignItems="Center" gap="200">
            {screenSize !== ScreenSize.Mobile && <Icon size="400" src={Icons.Photo} />}
            <Text size="H3" truncate>
              Feed
            </Text>
          </Box>
          <Box grow="Yes" basis="No" />
        </Box>
      </PageHeader>
      <Box style={{ position: 'relative' }} grow="Yes">
        <Scroll ref={scrollRef} hideTrack visibility="Hover">
          <PageContent>
            <PageContentCenter>
              <Feed rooms={rooms} />
            </PageContentCenter>
          </PageContent>
        </Scroll>
        <Box className={css.CreatePostFab}>
          <Button
            variant="Primary"
            radii="Pill"
            size="500"
            before={<Icon src={Icons.Plus} size="100" />}
            onClick={() => openCreatePostModal()}
          >
            <Text size="B500">Share</Text>
          </Button>
        </Box>
      </Box>
    </Page>
  );
}
