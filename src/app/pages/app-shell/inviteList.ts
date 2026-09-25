import { RegistrationInvite, RegistrationInviteStatus } from '../../plugins/registration-bot';

export type InviteTone = 'positive' | 'neutral' | 'muted';

export type InviteDescription = {
  /** Short badge text, e.g. "Used". */
  label: string;
  tone: InviteTone;
  /** A line of detail under the invite, e.g. "Used by @carol:example.org on …". */
  detail?: string;
};

const LABELS: Record<RegistrationInviteStatus, string> = {
  unused: 'Not used yet',
  pending: 'In progress',
  used: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
};

const TONES: Record<RegistrationInviteStatus, InviteTone> = {
  unused: 'neutral',
  pending: 'neutral',
  used: 'positive',
  expired: 'muted',
  revoked: 'muted',
};

/** How to show an invite's status. `formatTime` turns a millisecond timestamp into text. */
export const describeInvite = (
  invite: RegistrationInvite,
  formatTime: (ms: number) => string
): InviteDescription => {
  const label = LABELS[invite.status];
  const tone = TONES[invite.status];

  switch (invite.status) {
    case 'used': {
      if (invite.registeredUserId === null) return { label, tone };
      const when = invite.registeredAt === null ? '' : ` on ${formatTime(invite.registeredAt)}`;
      return { label, tone, detail: `Used by ${invite.registeredUserId}${when}` };
    }
    case 'pending':
      return { label, tone, detail: 'Someone is registering with this link now' };
    case 'unused':
      return invite.expiresAt === null
        ? { label, tone, detail: 'Never expires' }
        : { label, tone, detail: `Expires ${formatTime(invite.expiresAt)}` };
    default:
      return { label, tone };
  }
};

/** "3 invites · 1 used" — a one-line summary above the list. */
export const summarizeInvites = (invites: RegistrationInvite[]): string => {
  const used = invites.filter((invite) => invite.status === 'used').length;
  const total = `${invites.length} ${invites.length === 1 ? 'invite' : 'invites'}`;
  return `${total} · ${used} used`;
};
