import {
  AuthDict,
  AuthType,
  IAuthData,
  MatrixClient,
  MatrixError,
  UIAuthCallback,
} from 'matrix-js-sdk';

/**
 * A brand-new account has no cross-signing identity, and until it has one:
 * - matrix-js-sdk won't share room history with it on invite (MSC4268 key
 *   bundles are only sent to devices cross-signed by their owner), so it
 *   can't read messages sent before it joined;
 * - clients that exclude insecure devices (e.g. Element) neither send it room
 *   keys nor accept keys from it, so its own messages show as undecryptable.
 *
 * So right after registering we set up cross-signing for the new device
 * without asking. This only covers cross-signing - a recovery key (secret
 * storage + key backup) still has to be set up by the user from Settings.
 */

const PENDING_KEY = 'cinny_pending_cross_signing';

/**
 * The password the account was just registered with, kept in memory only so
 * we can answer the homeserver's auth prompt when uploading the signing keys
 * (servers implementing MSC3967 don't prompt for the first upload). Never
 * persisted - it's gone after a reload.
 */
let pendingPassword: { userId: string; password: string } | undefined;

export const markNewAccountForCrossSigning = (userId: string, password?: string) => {
  localStorage.setItem(PENDING_KEY, userId);
  pendingPassword = password ? { userId, password } : undefined;
};

export const isCrossSigningPendingFor = (userId: string): boolean =>
  localStorage.getItem(PENDING_KEY) === userId;

export const clearPendingCrossSigning = () => {
  localStorage.removeItem(PENDING_KEY);
  pendingPassword = undefined;
};

const getPendingPassword = (userId: string): string | undefined =>
  pendingPassword?.userId === userId ? pendingPassword.password : undefined;

export const makePasswordAuth = (userId: string, password: string, session?: string): AuthDict => ({
  type: AuthType.Password,
  identifier: { type: 'm.id.user', user: userId },
  password,
  session,
});

/**
 * Uploads the signing keys without auth first, and when the server asks for
 * it (401) retries once with the account password, if we have it.
 */
export const makeNewAccountSigningKeysAuth =
  (userId: string, password?: string): UIAuthCallback<void> =>
  async (makeRequest) => {
    try {
      await makeRequest(null);
    } catch (e) {
      if (!password || !(e instanceof MatrixError) || e.httpStatus !== 401) throw e;
      const { session } = (e.data ?? {}) as IAuthData;
      await makeRequest(makePasswordAuth(userId, password, session));
    }
  };

/**
 * Sets up cross-signing for an account registered on this device, if it
 * still needs it. Does nothing for other accounts, and never replaces an
 * identity that already exists on the server.
 */
export const bootstrapNewAccountCrossSigning = async (mx: MatrixClient): Promise<void> => {
  const userId = mx.getSafeUserId();
  if (!isCrossSigningPendingFor(userId)) return;
  const crypto = mx.getCrypto();
  if (!crypto) return;

  try {
    if (!(await crypto.userHasCrossSigningKeys(userId, true))) {
      await crypto.bootstrapCrossSigning({
        authUploadDeviceSigningKeys: makeNewAccountSigningKeysAuth(
          userId,
          getPendingPassword(userId)
        ),
      });
    }
    clearPendingCrossSigning();
  } catch (e) {
    // Auth rejected: we can't finish without the user, who can still set up
    // verification from Settings. Anything else (e.g. network) is retried on
    // the next load.
    if (e instanceof MatrixError && (e.httpStatus === 401 || e.httpStatus === 403)) {
      clearPendingCrossSigning();
    }
    throw e;
  }
};
