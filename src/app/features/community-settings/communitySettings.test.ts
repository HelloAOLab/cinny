import { describe, expect, it } from 'vitest';
import { JoinRule, RestrictedAllowType } from 'matrix-js-sdk';
import { StateEvent } from '../../../types/matrix/room';
import {
  compareCommunityMembers,
  getCommunityRole,
  getCommunityVisibility,
  getInviteBlockReason,
  getSpaceVisibilityChanges,
  isCommunityAdmin,
  parseInviteUserId,
  shouldUpdateChildJoinRule,
} from './communitySettings';

const SPACE_ID = '!space:example.org';

describe('isCommunityAdmin', () => {
  const powerLevels = { users_default: 0, users: { '@admin:x': 100, '@mod:x': 50 } };

  it('is true for users with admin power', () => {
    expect(isCommunityAdmin(new Set(), powerLevels, '@admin:x')).toBe(true);
  });

  it('is false for moderators and regular members', () => {
    expect(isCommunityAdmin(new Set(), powerLevels, '@mod:x')).toBe(false);
    expect(isCommunityAdmin(new Set(), powerLevels, '@member:x')).toBe(false);
  });

  it('is true for room creators regardless of power levels', () => {
    expect(isCommunityAdmin(new Set(['@creator:x']), powerLevels, '@creator:x')).toBe(true);
  });
});

describe('getCommunityVisibility', () => {
  it('is public only for public join rules', () => {
    expect(getCommunityVisibility({ join_rule: JoinRule.Public })).toBe('public');
    expect(getCommunityVisibility({ join_rule: JoinRule.Invite })).toBe('private');
    expect(getCommunityVisibility({ join_rule: JoinRule.Knock })).toBe('private');
    expect(getCommunityVisibility(undefined)).toBe('private');
  });
});

describe('getSpaceVisibilityChanges', () => {
  it('makes the space public and world-readable', () => {
    expect(getSpaceVisibilityChanges('public', 'shared')).toEqual([
      { type: StateEvent.RoomJoinRules, content: { join_rule: JoinRule.Public } },
      {
        type: StateEvent.RoomHistoryVisibility,
        content: { history_visibility: 'world_readable' },
      },
    ]);
  });

  it('skips history visibility when already world-readable', () => {
    expect(getSpaceVisibilityChanges('public', 'world_readable')).toEqual([
      { type: StateEvent.RoomJoinRules, content: { join_rule: JoinRule.Public } },
    ]);
  });

  it('makes the space invite-only and stops it being world-readable', () => {
    expect(getSpaceVisibilityChanges('private', 'world_readable')).toEqual([
      { type: StateEvent.RoomJoinRules, content: { join_rule: JoinRule.Invite } },
      { type: StateEvent.RoomHistoryVisibility, content: { history_visibility: 'shared' } },
    ]);
  });

  it('leaves a non world-readable history visibility alone when going private', () => {
    expect(getSpaceVisibilityChanges('private', 'invited')).toEqual([
      { type: StateEvent.RoomJoinRules, content: { join_rule: JoinRule.Invite } },
    ]);
  });
});

describe('shouldUpdateChildJoinRule', () => {
  const restricted = (roomId: string) => ({
    join_rule: JoinRule.Restricted,
    allow: [{ type: RestrictedAllowType.RoomMembership, room_id: roomId }],
  });

  it('moves public rooms when going private', () => {
    expect(shouldUpdateChildJoinRule({ join_rule: JoinRule.Public }, 'private', SPACE_ID)).toBe(
      true
    );
    expect(shouldUpdateChildJoinRule(restricted(SPACE_ID), 'private', SPACE_ID)).toBe(false);
  });

  it('moves rooms restricted to the community when going public', () => {
    expect(shouldUpdateChildJoinRule(restricted(SPACE_ID), 'public', SPACE_ID)).toBe(true);
    expect(shouldUpdateChildJoinRule(restricted('!other:x'), 'public', SPACE_ID)).toBe(false);
  });

  it('leaves invite-only rooms alone', () => {
    expect(shouldUpdateChildJoinRule({ join_rule: JoinRule.Invite }, 'public', SPACE_ID)).toBe(
      false
    );
    expect(shouldUpdateChildJoinRule({ join_rule: JoinRule.Invite }, 'private', SPACE_ID)).toBe(
      false
    );
  });

  it('does nothing without a join rule', () => {
    expect(shouldUpdateChildJoinRule(undefined, 'public', SPACE_ID)).toBe(false);
  });
});

describe('getCommunityRole', () => {
  it('labels admins and moderators', () => {
    expect(getCommunityRole(100)).toBe('Admin');
    expect(getCommunityRole(50)).toBe('Moderator');
    expect(getCommunityRole(0)).toBeUndefined();
  });
});

describe('compareCommunityMembers', () => {
  it('sorts by power, then name, then user id', () => {
    const members = [
      { userId: '@c:x', name: 'bob', powerLevel: 0 },
      { userId: '@a:x', name: 'Zed', powerLevel: 100 },
      { userId: '@b:x', name: 'Alice', powerLevel: 0 },
      { userId: '@d:x', name: 'Bob', powerLevel: 0 },
    ];
    expect([...members].sort(compareCommunityMembers).map((m) => m.userId)).toEqual([
      '@a:x',
      '@b:x',
      '@c:x',
      '@d:x',
    ]);
  });
});

describe('parseInviteUserId', () => {
  it('accepts full user IDs', () => {
    expect(parseInviteUserId('@alice:example.org', 'home.org')).toBe('@alice:example.org');
    expect(parseInviteUserId('  @alice:example.org ', 'home.org')).toBe('@alice:example.org');
  });

  it('adds a missing @ to IDs with a server', () => {
    expect(parseInviteUserId('alice:example.org', 'home.org')).toBe('@alice:example.org');
  });

  it('puts bare usernames on the default server', () => {
    expect(parseInviteUserId('alice', 'home.org')).toBe('@alice:home.org');
    expect(parseInviteUserId('@alice', 'home.org')).toBe('@alice:home.org');
  });

  it('rejects input that cannot be a user ID', () => {
    expect(parseInviteUserId('', 'home.org')).toBeUndefined();
    expect(parseInviteUserId('   ', 'home.org')).toBeUndefined();
    expect(parseInviteUserId('alice smith', 'home.org')).toBeUndefined();
    expect(parseInviteUserId('@alice:', 'home.org')).toBeUndefined();
    expect(parseInviteUserId('alice', undefined)).toBeUndefined();
  });
});

describe('getInviteBlockReason', () => {
  it('blocks members, pending invites and bans', () => {
    expect(getInviteBlockReason('join')).toBe('is already a member');
    expect(getInviteBlockReason('invite')).toBe('has already been invited');
    expect(getInviteBlockReason('ban')).toBe('is banned from this community');
  });

  it('allows everyone else', () => {
    expect(getInviteBlockReason(undefined)).toBeUndefined();
    expect(getInviteBlockReason('leave')).toBeUndefined();
  });
});
