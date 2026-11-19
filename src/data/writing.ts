import { profile } from './profile';

// The Writing list, newest first. Each piece is its own page at /writing/<slug>.
export const writing = [
  { slug: 'hector-and-the-search-for-happiness', title: 'Hector and the Search for Happiness', date: '2026/11/18' },
  { slug: 'to-the-moon-and-back', title: 'To the moon and back', date: '2026/10/29' },
  { slug: 'a-way-of-life', title: 'A way of life', date: '2026/10/05' },
  { slug: 'learnings-from-past-three-years', title: 'Learnings from past three years', date: profile.lastUpdated.essays },
];
