import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { createPostModalAtom, CreatePostModalState } from '../createPostModal';

export const useCreatePostModalState = (): CreatePostModalState | undefined => {
  const data = useAtomValue(createPostModalAtom);

  return data;
};

type CloseCallback = () => void;
export const useCloseCreatePostModal = (): CloseCallback => {
  const setState = useSetAtom(createPostModalAtom);

  const close: CloseCallback = useCallback(() => {
    setState(undefined);
  }, [setState]);

  return close;
};

type OpenCallback = (options?: CreatePostModalState) => void;
export const useOpenCreatePostModal = (): OpenCallback => {
  const setState = useSetAtom(createPostModalAtom);

  const open: OpenCallback = useCallback(
    (options) => {
      setState(options ?? {});
    },
    [setState]
  );

  return open;
};
