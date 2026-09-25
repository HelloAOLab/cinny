/**
 * The text of a system notification for a new message, calling out mentions
 * and activity in a community's posts room.
 */
export const getMessageNotificationBody = (
  username: string,
  { mentioned, inPostsRoom }: { mentioned: boolean; inPostsRoom: boolean }
): string => {
  if (mentioned) {
    return inPostsRoom ? `${username} mentioned you in a post` : `${username} mentioned you`;
  }
  if (inPostsRoom) return `New post activity from ${username}`;
  return `New inbox notification from ${username}`;
};
