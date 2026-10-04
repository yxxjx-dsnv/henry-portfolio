import { profile } from './profile';

// The Writing list, newest first. Each piece is its own page at /writing/<slug>.
export const writing = [
  { slug: 'a-way-of-life', title: 'A way of life', date: '2026/10/05' },
  { slug: 'learnings-from-past-three-years', title: 'Learnings from past three years', date: profile.lastUpdated.essays },
];
