import { describe, expect, it } from 'vitest';
import { sanitizeCustomHtml, sanitizeText } from './sanitize';

describe('sanitizeCustomHtml', () => {
  it('strips <script> tags and their content', () => {
    const out = sanitizeCustomHtml('<p>hello</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<p>hello</p>');
  });

  it('strips inline event handler attributes', () => {
    const out = sanitizeCustomHtml('<img src="mxc://abc" onerror="alert(1)" />');
    expect(out).not.toContain('onerror');
  });

  it('strips javascript: URLs from links', () => {
    const out = sanitizeCustomHtml('<a href="javascript:alert(1)">click</a>');
    // eslint-disable-next-line no-script-url -- asserting the scheme was stripped, not using it
    expect(out).not.toContain('javascript:');
  });

  it('allows http(s) links and forces rel/target for anchors', () => {
    const out = sanitizeCustomHtml('<a href="https://example.com">link</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noreferrer noopener"');
    expect(out).toContain('target="_blank"');
  });

  it('keeps mxc:// image sources as <img>', () => {
    const out = sanitizeCustomHtml('<img src="mxc://server/mediaid" alt="pic" />');
    expect(out).toContain('<img');
    expect(out).toContain('src="mxc://server/mediaid"');
  });

  it('converts non-mxc image sources into a plain link instead of rendering the image', () => {
    const out = sanitizeCustomHtml('<img src="https://evil.example/track.png" alt="pic" />');
    expect(out).not.toContain('<img');
    expect(out).toContain('<a');
    expect(out).toContain('href="https://evil.example/track.png"');
  });

  it('drops disallowed tags but keeps their text content', () => {
    const out = sanitizeCustomHtml('<style>body{}</style><p>safe text</p>');
    expect(out).not.toContain('<style');
    expect(out).toContain('safe text');
  });

  it('only allows font/span colors matching hex colors, filtering other values', () => {
    const allowed = sanitizeCustomHtml(
      '<span data-mx-color="#ff0000" data-mx-bg-color="#00ff00">x</span>'
    );
    expect(allowed).toContain('color:#ff0000');
    expect(allowed).toContain('background-color:#00ff00');

    // Neither value matches the hex-color allowlist, so no `style` attribute
    // should be emitted at all (the dangerous/non-hex values must never reach CSS).
    const disallowed = sanitizeCustomHtml(
      '<span data-mx-color="javascript:alert(1)" data-mx-bg-color="red">x</span>'
    );
    expect(disallowed).not.toContain('style=');
  });

  it('limits nesting depth to avoid pathological/huge markup', () => {
    const nested = `${'<div>'.repeat(150)}x${'</div>'.repeat(150)}`;
    expect(() => sanitizeCustomHtml(nested)).not.toThrow();
  });
});

describe('sanitizeText', () => {
  it('escapes HTML special characters', () => {
    expect(sanitizeText(`<script>alert('x')</script> & "quoted"`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt; &amp; &quot;quoted&quot;'
    );
  });

  it('leaves plain text untouched', () => {
    expect(sanitizeText('hello world')).toBe('hello world');
  });
});
