import { MatrixEvent, MsgType } from 'matrix-js-sdk';

const ATTACHMENT_MSG_TYPES: string[] = [MsgType.Image, MsgType.Video, MsgType.Audio, MsgType.File];

export const isAttachmentEvent = (event: MatrixEvent): boolean => {
  const msgType = event.getContent().msgtype;
  return typeof msgType === 'string' && ATTACHMENT_MSG_TYPES.includes(msgType);
};

export type FeedEventRun = {
  isAttachmentRun: boolean;
  events: MatrixEvent[];
};

/**
 * Splits a post's events into consecutive runs of attachment vs
 * non-attachment events, preserving order, so a run of attachments can be
 * rendered as one horizontally scrollable group distinct from surrounding
 * text content.
 */
export const groupFeedEventRuns = (events: MatrixEvent[]): FeedEventRun[] => {
  const runs: FeedEventRun[] = [];

  events.forEach((event) => {
    const isAttachmentRun = isAttachmentEvent(event);
    const lastRun = runs[runs.length - 1];
    if (lastRun && lastRun.isAttachmentRun === isAttachmentRun) {
      lastRun.events.push(event);
    } else {
      runs.push({ isAttachmentRun, events: [event] });
    }
  });

  return runs;
};
