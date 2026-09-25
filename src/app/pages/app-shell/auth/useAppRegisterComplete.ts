import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomRegisterResponse } from '../../auth/register/registerUtil';
import {
  deleteAfterLoginRedirectPath,
  getAfterLoginRedirectPath,
} from '../../afterLoginRedirectPath';
import { getAppLoginPath, getAppPath, withSearchParam } from '../../pathUtils';
import { LoginPathSearchParams } from '../../paths';
import { getMxIdLocalPart, getMxIdServer } from '../../../utils/matrix';
import { setFallbackSession } from '../../../state/sessions';
import { markNewAccountForCrossSigning } from '../../../utils/newAccountCrossSigning';

/**
 * Forked from registerUtil.ts's useRegisterComplete: identical auto-session
 * branch, but redirects to the mobile login path (not the desktop one) when
 * the homeserver didn't auto-issue a session on register.
 */
export const useAppRegisterComplete = (data?: CustomRegisterResponse) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      const { response, baseUrl, password } = data;

      const userId = response.user_id;
      const accessToken = response.access_token;
      const deviceId = response.device_id;

      // Also when we're sent to login instead: the account is still new.
      markNewAccountForCrossSigning(userId, password);

      if (accessToken && deviceId) {
        setFallbackSession(accessToken, deviceId, userId, baseUrl);
        const afterLoginRedirectPath = getAfterLoginRedirectPath();
        deleteAfterLoginRedirectPath();
        navigate(afterLoginRedirectPath ?? getAppPath(), { replace: true });
      } else {
        const username = getMxIdLocalPart(userId);
        const userServer = getMxIdServer(userId);
        navigate(
          withSearchParam<LoginPathSearchParams>(getAppLoginPath(userServer), {
            username,
          }),
          { replace: true }
        );
      }
    }
  }, [data, navigate]);
};
