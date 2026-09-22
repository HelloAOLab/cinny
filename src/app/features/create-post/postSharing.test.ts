import { describe, expect, it } from 'vitest';
import { applyPostSharing } from './postSharing';

describe('applyPostSharing', () => {
  it('always sets m.post to true', () => {
    const result = applyPostSharing({ body: 'hello' });
    expect(result['m.post']).toBe(true);
  });

  it('includes m.post.sharing when a sharing level is passed', () => {
    const result = applyPostSharing({}, 'anonymous');
    expect(result['m.post.sharing']).toBe('anonymous');
  });

  it('omits m.post.sharing when no sharing level is passed', () => {
    const result = applyPostSharing({});
    expect('m.post.sharing' in result).toBe(false);
  });

  it('includes m.post.sharing.media when a media sharing level is passed', () => {
    const result = applyPostSharing({}, 'public', 'private');
    expect(result['m.post.sharing.media']).toBe('private');
  });

  it('omits m.post.sharing.media when no media sharing level is passed', () => {
    const result = applyPostSharing({}, 'public');
    expect('m.post.sharing.media' in result).toBe(false);
  });

  it('preserves the original content fields', () => {
    const result = applyPostSharing({ msgtype: 'm.text', body: 'hi' }, 'public', 'public');
    expect(result.msgtype).toBe('m.text');
    expect(result.body).toBe('hi');
  });

  it('does not mutate the input content object', () => {
    const content = { body: 'hi' };
    applyPostSharing(content, 'public', 'public');
    expect(content).toEqual({ body: 'hi' });
  });
});
