import { expect, test } from 'vitest';
import { createByteDecoder, createOutputCap, stripAnsi, toByteString } from './text';

test('Korean and accented text survive the round trip through byte strings', () => {
  const text = '안녕하세요 — café, 김민수';
  const bytes = toByteString(text);
  expect([...bytes].every((c) => c.charCodeAt(0) < 256)).toBe(true);
  expect(bytes.length).toBe(new TextEncoder().encode(text).length);
  const d = createByteDecoder();
  expect(d.push(bytes) + d.end()).toBe(text);
});

test('a character split across two writes still decodes', () => {
  const bytes = toByteString('한');
  const d = createByteDecoder();
  expect(d.push(bytes.slice(0, 1)) + d.push(bytes.slice(1)) + d.end()).toBe('한');
});

test('the toolchain progress colours are stripped', () => {
  expect(stripAnsi('\x1b[1;93m>\x1b[0m Untarring sysroot.tar... done.')).toBe('> Untarring sysroot.tar... done.');
});

test('output is capped, and the cap reports itself once something is cut', () => {
  const cap = createOutputCap(10);
  expect(cap.take('abcd')).toEqual({ text: 'abcd', full: false });
  expect(cap.take('efghijkl')).toEqual({ text: 'efghij', full: true });
  expect(cap.take('more')).toEqual({ text: '', full: true });
});

test('output of exactly the limit is not treated as too much', () => {
  const cap = createOutputCap(10);
  expect(cap.take('abcdefghij')).toEqual({ text: 'abcdefghij', full: false });
  expect(cap.take('')).toEqual({ text: '', full: false });
  expect(cap.take('k')).toEqual({ text: '', full: true });
});
