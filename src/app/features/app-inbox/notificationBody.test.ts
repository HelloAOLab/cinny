import { describe, expect, it } from 'vitest';
import { getMessageNotificationBody } from './notificationBody';

describe('getMessageNotificationBody', () => {
  it('calls out a mention in a post', () => {
    expect(getMessageNotificationBody('Ana', { mentioned: true, inPostsRoom: true })).toBe(
      'Ana mentioned you in a post'
    );
  });

  it('calls out a mention in a chat', () => {
    expect(getMessageNotificationBody('Ana', { mentioned: true, inPostsRoom: false })).toBe(
      'Ana mentioned you'
    );
  });

  it('describes other posts room activity', () => {
    expect(getMessageNotificationBody('Ana', { mentioned: false, inPostsRoom: true })).toBe(
      'New post activity from Ana'
    );
  });

  it('falls back to a generic message', () => {
    expect(getMessageNotificationBody('Ana', { mentioned: false, inPostsRoom: false })).toBe(
      'New inbox notification from Ana'
    );
  });
});
