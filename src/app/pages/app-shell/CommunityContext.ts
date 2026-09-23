import { Room } from 'matrix-js-sdk';
import { createContext, useContext } from 'react';

const CommunityContext = createContext<Room | null>(null);

export const CommunityProvider = CommunityContext.Provider;

export function useCommunity(): Room {
  const community = useContext(CommunityContext);
  if (!community) throw new Error('Community not provided!');
  return community;
}

export function useCommunityOptionally(): Room | null {
  return useContext(CommunityContext);
}
