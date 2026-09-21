import { describe, expect, it } from 'vitest';
import {
  EVENT_REGISTRATION_LINK_GENERATED,
  REGISTRATION_REL_TYPE,
  buildRegistrationLinkRequestContent,
  isRegistrationLinkResponseTo,
  parseRegistrationLinkResponse,
} from './registration-bot';

describe('buildRegistrationLinkRequestContent', () => {
  it('includes only homeserver_id when nothing else is given', () => {
    expect(buildRegistrationLinkRequestContent({ homeserverId: 'prod' })).toEqual({
      homeserver_id: 'prod',
    });
  });

  it('includes client_id and request_id when given', () => {
    expect(
      buildRegistrationLinkRequestContent({
        homeserverId: 'prod',
        clientId: 'web',
        requestId: 'abc',
      })
    ).toEqual({
      homeserver_id: 'prod',
      client_id: 'web',
      request_id: 'abc',
    });
  });
});

describe('isRegistrationLinkResponseTo', () => {
  const requestEventId = '$request:example.org';

  it('matches a response event relating to the request via m.relates_to', () => {
    const content = {
      success: true,
      'm.relates_to': { rel_type: REGISTRATION_REL_TYPE, event_id: requestEventId },
    };
    expect(
      isRegistrationLinkResponseTo(EVENT_REGISTRATION_LINK_GENERATED, content, requestEventId)
    ).toBe(true);
  });

  it('rejects events of the wrong type', () => {
    const content = {
      success: true,
      'm.relates_to': { rel_type: REGISTRATION_REL_TYPE, event_id: requestEventId },
    };
    expect(isRegistrationLinkResponseTo('m.room.message', content, requestEventId)).toBe(false);
  });

  it('rejects a response relating to a different request', () => {
    const content = {
      success: true,
      'm.relates_to': { rel_type: REGISTRATION_REL_TYPE, event_id: '$other:example.org' },
    };
    expect(
      isRegistrationLinkResponseTo(EVENT_REGISTRATION_LINK_GENERATED, content, requestEventId)
    ).toBe(false);
  });

  it('rejects a response with the wrong rel_type', () => {
    const content = {
      success: true,
      'm.relates_to': { rel_type: 'm.reference', event_id: requestEventId },
    };
    expect(
      isRegistrationLinkResponseTo(EVENT_REGISTRATION_LINK_GENERATED, content, requestEventId)
    ).toBe(false);
  });

  it('rejects a response missing m.relates_to entirely', () => {
    expect(
      isRegistrationLinkResponseTo(
        EVENT_REGISTRATION_LINK_GENERATED,
        { success: true },
        requestEventId
      )
    ).toBe(false);
  });
});

describe('parseRegistrationLinkResponse', () => {
  it('parses a successful response', () => {
    expect(
      parseRegistrationLinkResponse({
        success: true,
        link: 'https://app.example.org/?register_token=syt_abc',
        token: 'syt_abc',
        client_id: 'web',
      })
    ).toEqual({
      success: true,
      link: 'https://app.example.org/?register_token=syt_abc',
      token: 'syt_abc',
      clientId: 'web',
    });
  });

  it('parses a failure response with an error code and message', () => {
    expect(
      parseRegistrationLinkResponse({
        success: false,
        error: { code: 'conflict', message: "server 'prod' has no clients configured" },
      })
    ).toEqual({
      success: false,
      error: { code: 'conflict', message: "server 'prod' has no clients configured" },
    });
  });

  it('falls back to a generic message when success is false and error is malformed', () => {
    expect(parseRegistrationLinkResponse({ success: false })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });

  it('treats a response claiming success without a link as a failure', () => {
    expect(parseRegistrationLinkResponse({ success: true })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });
});
