import React from 'react';
import {
  Box,
  config,
  Header,
  Icon,
  IconButton,
  Icons,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Scroll,
  Text,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { CreatePostForm } from './CreatePost';
import {
  useCloseCreatePostModal,
  useCreatePostModalState,
} from '../../state/hooks/createPostModal';
import { CreatePostModalState } from '../../state/createPostModal';
import { stopPropagation } from '../../utils/keyboard';

type CreatePostModalProps = {
  state: CreatePostModalState;
};
function CreatePostModal({ state }: CreatePostModalProps) {
  const closeDialog = useCloseCreatePostModal();

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            onDeactivate: closeDialog,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Modal size="300" flexHeight>
            <Box direction="Column">
              <Header
                size="500"
                style={{
                  padding: config.space.S200,
                  paddingLeft: config.space.S400,
                }}
              >
                <Box grow="Yes">
                  <Text size="H4">Share</Text>
                </Box>
                <Box shrink="No">
                  <IconButton size="300" radii="300" onClick={closeDialog}>
                    <Icon src={Icons.Cross} />
                  </IconButton>
                </Box>
              </Header>
              <Scroll size="300" hideTrack>
                <Box
                  style={{
                    padding: config.space.S400,
                    paddingRight: config.space.S200,
                  }}
                  direction="Column"
                  gap="500"
                >
                  <CreatePostForm defaultRoomId={state.roomId} onCreate={closeDialog} />
                </Box>
              </Scroll>
            </Box>
          </Modal>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export function CreatePostModalRenderer() {
  const state = useCreatePostModalState();

  if (!state) return null;
  return <CreatePostModal state={state} />;
}
