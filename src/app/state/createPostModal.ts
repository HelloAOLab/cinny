import { atom } from 'jotai';
import { PostSharingLevel } from '../features/create-post/postSharing';

export type CreatePostModalState = {
  roomId?: string;
  sharing?: PostSharingLevel;
  sharingMedia?: PostSharingLevel;
};

export const createPostModalAtom = atom<CreatePostModalState | undefined>(undefined);
