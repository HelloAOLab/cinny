import { MsgType } from 'matrix-js-sdk';
import { describe, expect, it } from 'vitest';
import { groupFeedEventRuns, isAttachmentEvent } from './feedAttachmentRuns';

const fakeEvent = (id: string, msgtype: string | undefined) =>
  ({
    getId: () => id,
    getContent: () => (msgtype === undefined ? {} : { msgtype }),
  } as unknown as import('matrix-js-sdk').MatrixEvent);

describe('isAttachmentEvent', () => {
  it.each([MsgType.Image, MsgType.Video, MsgType.Audio, MsgType.File])(
    'treats %s events as attachments',
    (msgtype) => {
      expect(isAttachmentEvent(fakeEvent('a', msgtype))).toBe(true);
    }
  );

  it.each([MsgType.Text, MsgType.Emote, MsgType.Notice, MsgType.Location])(
    'does not treat %s events as attachments',
    (msgtype) => {
      expect(isAttachmentEvent(fakeEvent('a', msgtype))).toBe(false);
    }
  );

  it('does not treat events without a msgtype as attachments', () => {
    expect(isAttachmentEvent(fakeEvent('a', undefined))).toBe(false);
  });
});

describe('groupFeedEventRuns', () => {
  it('groups consecutive attachment events into a single run', () => {
    const events = [
      fakeEvent('img1', MsgType.Image),
      fakeEvent('img2', MsgType.Image),
      fakeEvent('img3', MsgType.Image),
    ];
    const runs = groupFeedEventRuns(events);
    expect(runs).toHaveLength(1);
    expect(runs[0].isAttachmentRun).toBe(true);
    expect(runs[0].events.map((e) => e.getId())).toEqual(['img1', 'img2', 'img3']);
  });

  it('splits a trailing caption into its own non-attachment run', () => {
    const events = [
      fakeEvent('img1', MsgType.Image),
      fakeEvent('img2', MsgType.Image),
      fakeEvent('caption', MsgType.Text),
    ];
    const runs = groupFeedEventRuns(events);
    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ isAttachmentRun: true });
    expect(runs[0].events.map((e) => e.getId())).toEqual(['img1', 'img2']);
    expect(runs[1]).toMatchObject({ isAttachmentRun: false });
    expect(runs[1].events.map((e) => e.getId())).toEqual(['caption']);
  });

  it('alternates runs when attachments and text interleave', () => {
    const events = [
      fakeEvent('text1', MsgType.Text),
      fakeEvent('img1', MsgType.Image),
      fakeEvent('img2', MsgType.Video),
      fakeEvent('text2', MsgType.Text),
    ];
    const runs = groupFeedEventRuns(events);
    expect(runs.map((r) => r.isAttachmentRun)).toEqual([false, true, false]);
    expect(runs.map((r) => r.events.map((e) => e.getId()))).toEqual([
      ['text1'],
      ['img1', 'img2'],
      ['text2'],
    ]);
  });

  it('returns an empty array for no events', () => {
    expect(groupFeedEventRuns([])).toEqual([]);
  });
});
