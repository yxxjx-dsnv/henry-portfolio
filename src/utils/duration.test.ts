import { durationLabel } from './duration';

const NOW = new Date(2026, 6, 3); // Jul 2026

test('month-to-month ranges', () => {
  expect(durationLabel('May 2024 - Jun 2025', NOW)).toBe('1 yr 2 mo');
  expect(durationLabel('Jan 2026 - Apr 2026', NOW)).toBe('4 mo');
});

test('present ranges count up to now', () => {
  expect(durationLabel('Sep 2025 - present', NOW)).toBe('11 mo');
});

test('unparseable ranges return null', () => {
  expect(durationLabel('2025', NOW)).toBeNull();
  expect(durationLabel('May 2025 - On hold', NOW)).toBeNull();
});
