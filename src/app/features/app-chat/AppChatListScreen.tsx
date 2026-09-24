import React from 'react';
import { useScreenSizeContext } from '../../hooks/useScreenSize';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { isAppChatSplitLayout } from '../../pages/app-shell/appLayout';
import { AppChatRoomList } from './AppChatRoomList';
import { AppChatSplit } from './AppChatSplit';

export function AppChatListScreen() {
  const community = useCommunity();
  const screenSize = useScreenSizeContext();

  if (isAppChatSplitLayout(screenSize)) {
    return (
      <AppChatSplit>
        <AppEmptyState
          title="Select a chat"
          subtitle={`Pick a room from ${community.name} to start chatting.`}
        />
      </AppChatSplit>
    );
  }

  return <AppChatRoomList />;
}
