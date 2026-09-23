import { useOutletContext } from 'react-router-dom';
import { PostType } from '../../features/create-post/postType';

export type AppOutletContext = {
  /** Post type selected in the home-screen tabs; undefined for "All". */
  postTypeFilter?: PostType;
};

export const useAppOutletContext = (): AppOutletContext =>
  useOutletContext<AppOutletContext | undefined>() ?? {};
