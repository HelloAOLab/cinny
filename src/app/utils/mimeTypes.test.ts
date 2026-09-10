import { describe, expect, it } from 'vitest';
import {
  getBlobSafeMimeType,
  getFileNameExt,
  getFileNameWithoutExt,
  mimeTypeToExt,
  safeFile,
} from './mimeTypes';

describe('getBlobSafeMimeType', () => {
  it('passes through allowed mime types unchanged', () => {
    expect(getBlobSafeMimeType('image/png')).toBe('image/png');
  });

  it('falls back to octet-stream for disallowed/unknown mime types', () => {
    expect(getBlobSafeMimeType('application/x-msdownload')).toBe('application/octet-stream');
  });

  it('falls back to octet-stream for dangerous types like svg (not in allowlist)', () => {
    expect(getBlobSafeMimeType('image/svg+xml')).toBe('application/octet-stream');
  });

  it('falls back to octet-stream for non-string input', () => {
    // @ts-expect-error deliberately passing a non-string
    expect(getBlobSafeMimeType(undefined)).toBe('application/octet-stream');
  });

  it('strips parameters before checking the allowlist', () => {
    expect(getBlobSafeMimeType('text/plain; charset=utf-8')).toBe('text/plain');
  });

  it('rewrites video/quicktime to video/mp4 for Chromium compatibility', () => {
    expect(getBlobSafeMimeType('video/quicktime')).toBe('video/mp4');
  });

  it('rewrites application/ogg to audio/ogg for playback', () => {
    expect(getBlobSafeMimeType('application/ogg')).toBe('audio/ogg');
  });
});

describe('safeFile', () => {
  it('returns the same file when its type is already safe', () => {
    const f = new File(['a'], 'a.png', { type: 'image/png' });
    expect(safeFile(f)).toBe(f);
  });

  it('returns a new file with a coerced safe type otherwise', () => {
    const f = new File(['a'], 'a.exe', { type: 'application/x-msdownload' });
    const safe = safeFile(f);
    expect(safe).not.toBe(f);
    expect(safe.type).toBe('application/octet-stream');
    expect(safe.name).toBe('a.exe');
  });
});

describe('file name / mime helpers', () => {
  it('mimeTypeToExt extracts the subtype', () => {
    expect(mimeTypeToExt('image/png')).toBe('png');
  });

  it('getFileNameExt extracts the extension', () => {
    expect(getFileNameExt('archive.tar.gz')).toBe('gz');
  });

  it('getFileNameExt returns the whole name when there is no extension', () => {
    expect(getFileNameExt('README')).toBe('README');
  });

  it('getFileNameWithoutExt strips only the last extension', () => {
    expect(getFileNameWithoutExt('archive.tar.gz')).toBe('archive.tar');
  });

  it('getFileNameWithoutExt returns original name for dotfiles or extensionless names', () => {
    expect(getFileNameWithoutExt('.gitignore')).toBe('.gitignore');
    expect(getFileNameWithoutExt('README')).toBe('README');
  });
});
