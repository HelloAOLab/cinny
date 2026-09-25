import { describe, expect, it } from 'vitest';
import type { RegistrationInvite } from '../../plugins/registration-bot';
import { describeInvite, summarizeInvites } from './inviteList';

const invite = (overrides: Partial<RegistrationInvite> = {}): RegistrationInvite => ({
  tokenSha256: 'abc',
  status: 'unused',
  clientId: null,
  issuedAt: 1,
  expiresAt: null,
  registeredUserId: null,
  registeredAt: null,
  ...overrides,
});

const formatTime = (ms: number) => `t${ms}`;

describe('describeInvite', () => {
  it('names who used a link and when', () => {
    expect(
      describeInvite(
        invite({ status: 'used', registeredUserId: '@carol:example.org', registeredAt: 5 }),
        formatTime
      )
    ).toEqual({ label: 'Used', tone: 'positive', detail: 'Used by @carol:example.org on t5' });
  });

  it('leaves out the date when the registration time is unknown', () => {
    expect(
      describeInvite(invite({ status: 'used', registeredUserId: '@carol:example.org' }), formatTime)
        .detail
    ).toBe('Used by @carol:example.org');
  });

  it('has no detail for a used link with no known user', () => {
    expect(describeInvite(invite({ status: 'used' }), formatTime)).toEqual({
      label: 'Used',
      tone: 'positive',
    });
  });

  it('shows when an unused link expires', () => {
    expect(describeInvite(invite({ expiresAt: 9 }), formatTime).detail).toBe('Expires t9');
    expect(describeInvite(invite(), formatTime).detail).toBe('Never expires');
  });

  it('mutes expired and revoked links', () => {
    expect(describeInvite(invite({ status: 'expired' }), formatTime)).toEqual({
      label: 'Expired',
      tone: 'muted',
    });
    expect(describeInvite(invite({ status: 'revoked' }), formatTime)).toEqual({
      label: 'Revoked',
      tone: 'muted',
    });
  });

  it('describes a pending link', () => {
    expect(describeInvite(invite({ status: 'pending' }), formatTime).label).toBe('In progress');
  });
});

describe('summarizeInvites', () => {
  it('counts invites and used ones', () => {
    expect(summarizeInvites([invite(), invite({ status: 'used' })])).toBe('2 invites · 1 used');
    expect(summarizeInvites([invite()])).toBe('1 invite · 0 used');
  });
});
