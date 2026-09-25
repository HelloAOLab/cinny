const BAD_ENCRYPTED_PREFIX = '** Unable to decrypt:';
const BAD_ENCRYPTED_SUFFIX = '**';
const ERROR_NAME_PREFIX = /^DecryptionError:\s*/;

/**
 * Extracts the human-readable decryption failure reason from the body of an
 * `m.bad.encrypted` placeholder event created by matrix-js-sdk.
 *
 * The SDK sets the body to `** Unable to decrypt: <String(error)> **`, where
 * the error usually stringifies as `DecryptionError: <message>`.
 */
export const getDecryptionFailureReason = (body: unknown): string | undefined => {
  if (typeof body !== 'string') return undefined;

  let reason = body.trim();
  if (!reason.startsWith(BAD_ENCRYPTED_PREFIX)) return undefined;

  reason = reason.slice(BAD_ENCRYPTED_PREFIX.length);
  if (reason.endsWith(BAD_ENCRYPTED_SUFFIX)) {
    reason = reason.slice(0, -BAD_ENCRYPTED_SUFFIX.length);
  }
  reason = reason.trim().replace(ERROR_NAME_PREFIX, '').trim();

  return reason || undefined;
};
