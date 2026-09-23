import React, { ReactNode } from 'react';
import { AppChatRoomList } from './AppChatRoomList';
import * as css from './AppChat.css';

type AppChatSplitProps = {
  selectedRoomId?: string;
  children: ReactNode;
};

/** Desktop chat view: the community's room list beside the open room (or a placeholder). */
export function AppChatSplit({ selectedRoomId, children }: AppChatSplitProps) {
  return (
    <div className={css.Split}>
      <div className={css.SplitList}>
        <AppChatRoomList selectedRoomId={selectedRoomId} />
      </div>
      <div className={css.SplitContent}>{children}</div>
    </div>
  );
}
