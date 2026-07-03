import { activities } from './activities';
import { education } from './education';
import { profile } from './profile';

test('activities has 7 entries, each with a prefix and date', () => {
  expect(activities).toHaveLength(7);
  for (const a of activities) {
    expect(a.prefix.length).toBeGreaterThan(0);
    expect(a.date.length).toBeGreaterThan(0);
  }
});

test('first activity is the UTKESA executive role with two detail paragraphs', () => {
  const first = activities[0];
  expect(first.prefix).toContain('Executive member at');
  expect(first.link?.label).toBe('UTKESA');
  expect(first.suffix).toContain('Event Dept.');
  expect(first.detail).toHaveLength(2);
});

test('education is grouped by school with nested programs', () => {
  expect(education).toHaveLength(2);
  expect(education[0].school.url).toBe('https://www.utoronto.ca');
  expect(education[0].entries.length).toBeGreaterThanOrEqual(3);
  expect(education[0].entries[0].program).toContain('Electrical & Computer Engineering');
  expect(education[1].school.name).toBe('Walnut Grove Secondary School');
});

test('profile exposes social links and section dates', () => {
  expect(profile.social.github).toBe('https://github.com/yxxjx-dsnv');
  expect(profile.social.email).toBe('mailto:mail2yjkim@gmail.com');
  expect(profile.lastUpdated.home).toBe('2026/02/03');
  expect(profile.lastUpdated.essays).toBe('2025/01/02');
});
