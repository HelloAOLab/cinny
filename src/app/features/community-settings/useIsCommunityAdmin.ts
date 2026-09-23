import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { usePowerLevels } from '../../hooks/usePowerLevels';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { isCommunityAdmin } from './communitySettings';

/** Whether the current user administers `community`; updates live. */
export const useIsCommunityAdmin = (community: Room): boolean => {
  const mx = useMatrixClient();
  const powerLevels = usePowerLevels(community);
  const creators = useRoomCreators(community);
  return isCommunityAdmin(creators, powerLevels, mx.getSafeUserId());
};
