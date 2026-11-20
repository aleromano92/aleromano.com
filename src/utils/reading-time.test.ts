import { describe, it, expect } from 'vitest';
import { stripHtmlToPlainText, getReadingTime } from './reading-time';

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('stripHtmlToPlainText', () => {
  it('removes HTML tags', () => {
    expect(stripHtmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('removes markdown emphasis/symbol characters', () => {
    expect(stripHtmlToPlainText('**bold** _italic_ `code` ~strike~ # heading')).toBe(
      'bold italic code strike heading'
    );
  });

  it('removes markdown links but keeps surrounding text', () => {
    expect(stripHtmlToPlainText('see [the docs](https://example.com) now')).toBe('see  now');
  });

  it('strips the link body of an image reference (current behavior leaves the "!")', () => {
    expect(stripHtmlToPlainText('before ![alt text](/img.png) after')).toBe('before ! after');
  });

  it('removes wiki-style links', () => {
    expect(stripHtmlToPlainText('link to [[Some Page]] here')).toBe('link to  here');
  });

  it('collapses repeated whitespace and trims', () => {
    expect(stripHtmlToPlainText('  a   b\n\nc  ')).toBe('a b c');
  });
});

describe('getReadingTime', () => {
  it('rounds up to whole minutes (195 words = 1 minute)', () => {
    expect(getReadingTime(words(195))).toBe(1);
  });

  it('crosses to 2 minutes at 196 words (boundary of 195 wpm + ceil)', () => {
    expect(getReadingTime(words(196))).toBe(2);
  });

  it('computes longer texts: 600 words = 4 minutes', () => {
    expect(getReadingTime(words(600))).toBe(4);
  });

  it('returns at least 1 minute for very short content', () => {
    expect(getReadingTime('one short line')).toBe(1);
  });

  it('strips markup before counting words', () => {
    expect(getReadingTime('<p>hello</p> [x](http://y.z)')).toBe(1);
  });
});
