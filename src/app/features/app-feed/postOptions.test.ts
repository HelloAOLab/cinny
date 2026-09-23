import { describe, expect, it } from 'vitest';
import { canRemovePost } from './postOptions';

const base = {
  canRedact: false,
  canDeleteOwn: false,
  senderId: '@alice:example.org',
  userId: '@alice:example.org',
  isRedacted: false,
};

describe('canRemovePost', () => {
  it('lets moderators remove anyone’s post', () => {
    expect(canRemovePost({ ...base, canRedact: true, userId: '@mod:example.org' })).toBe(true);
  });

  it('lets users remove their own post when they can send redactions', () => {
    expect(canRemovePost({ ...base, canDeleteOwn: true })).toBe(true);
  });

  it('does not let users remove other people’s posts without the redact level', () => {
    expect(canRemovePost({ ...base, canDeleteOwn: true, userId: '@bob:example.org' })).toBe(false);
  });

  it('does not let users remove their own post without redaction permission', () => {
    expect(canRemovePost(base)).toBe(false);
  });

  it('requires a known user id to match the sender', () => {
    expect(canRemovePost({ ...base, canDeleteOwn: true, senderId: undefined, userId: null })).toBe(
      false
    );
  });

  it('never offers removal for an already-redacted post', () => {
    expect(canRemovePost({ ...base, canRedact: true, isRedacted: true })).toBe(false);
  });
});
