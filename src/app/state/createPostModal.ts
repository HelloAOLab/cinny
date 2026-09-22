import { atom } from 'jotai';

export type CreatePostModalState = {
  roomId?: string;
};

export const createPostModalAtom = atom<CreatePostModalState | undefined>(undefined);
