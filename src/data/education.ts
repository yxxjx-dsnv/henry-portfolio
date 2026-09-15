import type { EducationGroup } from '../types';

// Grouped by school (대분류), with program history nested under each (소분류).
export const education: EducationGroup[] = [
  {
    school: {
      name: 'University of Toronto',
      url: 'https://www.utoronto.ca',
      logo: '/media/education/uoft.svg',
      roundLogo: true,
    },
    degree: 'Faculty of Applied Science & Engineering',
    docs: [
      {
        title: 'Offer of Admission — Engineering Science',
        meta: 'March 25, 2025 · 2 pages',
        file: 'acceptance-letter.pdf',
      },
      {
        title: 'International Scholar Award — Award Letter',
        meta: 'March 25, 2025 · 1 page',
        file: 'scholarship-letter.pdf',
      },
    ],
    entries: [
      {
        program: 'Electrical & Computer Engineering (ECE) - BASc + PEY Co-op',
        date: 'Sep 2028 - 2031',
        //term: 'Year 2 – 4',
      },
      {
        program: 'Mandatory Military Service @ S.Korea',
        date: 'Jan 2027 - Jul 2028',
        term: 'Leave of absence',
        muted: true,
      },
      {
        program: 'TrackOne (Undeclared Engineering) - BASc + PEY Co-op',
        date: 'Jan 2026 - Apr 2026',
        term: 'Winter 2025',
        detail: [
          'APS105 Computer Fundamentals',
          'APS112 Engineering Strategies & Practice II',
          'APS191 Intro to Engineering (TrackOne Seminar)',
          'ECE110 Electrical Fundamentals',
          'MAT187 Calculus II',
          'MAT188 Linear Algebra',
        ],
      },
      {
        program: 'Engineering Science - BASc + PEY Co-op',
        date: 'Sep 2025 - Jan 2026',
        term: 'Fall 2025',
        lead: 'U of T Engineering International Scholar Award — $80,000',
        detail: [
          'CIV102 Structures & Materials',
          'ESC101 Praxis I',
          'ESC194 Calculus I',
          'PHY180 Classical Mechanics',
        ],
        projects:
          'Projects: the CIV102 matboard box girder, the ESC101 team design analysis, and the PHY180 hand-made pendulum.',
      },
    ],
  },
  {
    school: { name: 'Walnut Grove Secondary School', url: 'https://www.wgss.ca', logo: '/media/education/wgss.svg' },
    entries: [
      {
        program: 'Dogwood Diploma · Advanced Program (AP)',
        date: 'Sep 2022 - Jun 2025',
        term: 'Grade 10 – 12',
        lead: 'Grade 11–12 GPA: 3.88 / 4.0',
        detail: [
          'AP Calculus AB',
          'AP Macroeconomics',
          'AP Microeconomics',
        ],
      },
    ],
  },
];
