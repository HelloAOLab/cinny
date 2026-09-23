type RemovePostPermissions = {
  /** User may redact anyone's events (the room's `redact` power level). */
  canRedact: boolean;
  /** User may send m.room.redaction events, which is enough to remove their own. */
  canDeleteOwn: boolean;
  senderId: string | undefined;
  userId: string | null | undefined;
  isRedacted: boolean;
};

/**
 * Whether the post options menu should offer "Remove" for a post: moderators
 * with the redact power level can remove any post, and everyone else can
 * remove their own if they're allowed to send redactions at all.
 */
export const canRemovePost = ({
  canRedact,
  canDeleteOwn,
  senderId,
  userId,
  isRedacted,
}: RemovePostPermissions): boolean => {
  if (isRedacted) return false;
  if (canRedact) return true;
  return canDeleteOwn && !!userId && senderId === userId;
};
