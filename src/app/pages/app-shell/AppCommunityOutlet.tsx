import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

/**
 * Nested outlet for the per-community routes (feed, chat list, chat room)
 * that forwards the AppShell's outlet context, since each Outlet otherwise
 * resets it.
 */
export function AppCommunityOutlet() {
  return <Outlet context={useOutletContext()} />;
}
