import { activities } from './activities';
import { education } from './education';
import { profile } from './profile';

test('activities has 9 entries, each with a prefix and date', () => {
  expect(activities).toHaveLength(9);
  for (const a of activities) {
    expect(a.prefix.length).toBeGreaterThan(0);
    expect(a.date.length).toBeGreaterThan(0);
  }
});

test('first activity is the Incheon Robotics internship, with its logo', () => {
  const first = activities[0];
  expect(first.prefix).toContain('AI/Robotics Engineering Intern at');
  expect(first.link?.label).toBe('Incheon Robotics');
  expect(first.date).toBe('Aug 2026 - present');
  expect(first.logo).toBe('/Images/incheon-robotics.png');
});

test('the Greenstone Grind follows, with a story-page slug', () => {
  const second = activities[1];
  expect(second.prefix).toBe('The Greenstone Grind');
  expect(second.slug).toBe('greenstone-grind');
  expect(second.detail).toHaveLength(1);
});

test('the UTKESA executive role follows, with the donation detail', () => {
  const third = activities[2];
  expect(third.prefix).toContain('Event Dept. Executive at');
  expect(third.link?.label).toBe('UTKESA');
  expect(third.detail).toHaveLength(3);
  expect(third.detail?.[2]).toContain('Korea Root Initiative');
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
  expect(profile.lastUpdated.home).toBe('2026/09/15');
  expect(profile.lastUpdated.essays).toBe('2025/01/02');
});
