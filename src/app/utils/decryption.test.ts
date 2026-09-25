import { describe, expect, it } from 'vitest';
import { getDecryptionFailureReason } from './decryption';

describe('getDecryptionFailureReason', () => {
  it('extracts the reason and strips the error name', () => {
    expect(
      getDecryptionFailureReason(
        "** Unable to decrypt: DecryptionError: The sender's device has not sent us the keys for this message. **"
      )
    ).toBe("The sender's device has not sent us the keys for this message.");
  });

  it('keeps reasons that are not DecryptionErrors', () => {
    expect(getDecryptionFailureReason('** Unable to decrypt: Error: Something broke **')).toBe(
      'Error: Something broke'
    );
  });

  it('handles a missing suffix', () => {
    expect(getDecryptionFailureReason('** Unable to decrypt: DecryptionError: Oops')).toBe('Oops');
  });

  it('returns undefined for bodies without a reason', () => {
    expect(getDecryptionFailureReason('** Unable to decrypt:  **')).toBeUndefined();
    expect(getDecryptionFailureReason('** Unable to decrypt: DecryptionError: **')).toBeUndefined();
  });

  it('returns undefined for unrelated or non-string bodies', () => {
    expect(getDecryptionFailureReason('hello')).toBeUndefined();
    expect(getDecryptionFailureReason(undefined)).toBeUndefined();
    expect(getDecryptionFailureReason(42)).toBeUndefined();
  });
});
