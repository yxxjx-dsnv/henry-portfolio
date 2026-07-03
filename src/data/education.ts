import type { EducationGroup } from '../types';

// Grouped by school (대분류), with program history nested under each (소분류).
export const education: EducationGroup[] = [
  {
    school: { name: 'University of Toronto', url: 'https://www.utoronto.ca' },
    degree: 'Faculty of Applied Science & Engineering',
    entries: [
      {
        program: 'Electrical & Computer Engineering (ECE) - BASc',
        date: 'Sep 2028 - 2031',
        //term: 'Year 2 – 4',
      },
      {
        program: 'Mandatory Military Service @ S.Korea',
        date: 'Oct 2026 - Apr 2028',
        term: 'Leave of absence',
        muted: true,
      },
      {
        program: 'TrackOne (Undeclared Engineering) - BASc',
        date: 'Jan 2026 - Apr 2026',
        term: 'Freshman - Winter',
      },
      {
        program: 'Engineering Science - BASc',
        date: 'Sep 2025 - Jan 2026',
        term: 'Freshman - Fall',
      },
    ],
  },
  {
    school: { name: 'Walnut Grove Secondary School', url: 'https://www.wgss.ca' },
    entries: [
      {
        program: 'High School Diploma | Advanced Program (AP)',
        date: 'Sep 2022 - Jun 2025',
        term: 'Grade 10 – 12',
      },
    ],
  },
];
