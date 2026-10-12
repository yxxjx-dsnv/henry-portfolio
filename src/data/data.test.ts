import { activities } from './activities';
import { education } from './education';
import { profile } from './profile';

test('activities has 10 entries, each with a prefix and date', () => {
  expect(activities).toHaveLength(10);
  for (const a of activities) {
    expect(a.prefix.length).toBeGreaterThan(0);
    expect(a.date.length).toBeGreaterThan(0);
  }
});

test('first activity is the current Nu Eyne internship, ending on its planned date', () => {
  const first = activities[0];
  expect(first.prefix).toBe('Full Stack Developer Intern at Nu Eyne');
  expect(first.suffix).toContain('LIVEALL');
  expect(first.link).toBeUndefined(); // no official URL yet
  expect(first.date).toBe('Sep 2026 - Dec 2026 (planned)');
  expect(first.detail).toHaveLength(1); // a detail makes the row an expandable control (BUG-3)
});

test('the Incheon Robotics internship follows, ended, with its logo', () => {
  const incheon = activities[1];
  expect(incheon.prefix).toContain('AI/Robotics Engineering Intern at');
  expect(incheon.link?.label).toBe('Incheon Robotics');
  expect(incheon.date).toBe('Aug 2026 - Oct 2026');
  expect(incheon.logo).toBe('/Images/incheon-robotics.png');
});

test('the Greenstone Grind follows, with a story-page slug', () => {
  const second = activities[2];
  expect(second.prefix).toBe('The Greenstone Grind');
  expect(second.slug).toBe('greenstone-grind');
  expect(second.detail).toHaveLength(1);
});

test('the UTKESA executive role follows, ended, with the donation detail', () => {
  const third = activities[3];
  expect(third.date).toBe('Sep 2025 - Aug 2026');
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
  expect(profile.lastUpdated.home).toBe('2026/10/12');
  expect(profile.lastUpdated.essays).toBe('2025/01/02');
});
