import type { Project } from '../types';

// Brief project archive drawn from the resume. Hover a row for a one-line detail.
export const projects: Project[] = [
  {
    name: 'Incheon ASRS — AI/ML Voice Recognition for Grid-Based Warehouse Robots',
    date: 'Aug 2026 - present',
    stack: ['AI/ML', 'Voice Recognition', 'Robotics', 'Embedded', 'Fleet Control'],
    link: { label: 'Incheon Robotics', url: 'https://incheonrobotics.com' },
    slug: 'incheon-robotics',
    detail: [
      'My work as an AI/Robotics Engineering Intern at Incheon Robotics: implementing the AI/ML voice recognition that lets an operator control the whole grid-based ASRS without touching the screen, plus the robot build itself. The machine, the Deep-N fleet scheduling behind it, the Gwangju deployment, and an interactive 3D simulation of the system all live on its own page.',
    ],
  },
  {
    name: 'Campus Pulse — Live Campus Occupancy Dashboard',
    date: 'Mar 2026',
    stack: ['AWS Rekognition', 'DynamoDB', 'Lambda', 'API Gateway', 'React', 'Python'],
    slug: 'campus-pulse',
    detail: [
      'Built in one day at the IEEE × AWS "Hack the Student Life" hackathon (Amazon Toronto): a real-time dashboard showing how crowded each campus library is, floor by floor. My first hackathon. The full story, photos, and demo live on its own page.',
    ],
  },
  {
    name: 'MONO — Resale Analytics Platform',
    date: '2025',
    stack: ['AI', 'Automation', 'Shopify'],
    slug: 'mono',
    detail: [
      'The startup I am building: an AI resale-analytics platform that scores products for profit, then lists and reprices them on a storefront on its own. The vision, the Profit Score, and the research behind it live on its own page.',
    ],
  },
  {
    name: 'Gyroscope Wand — Skule™ Kup Response System',
    date: 'Jan 2026 - Apr 2026',
    stack: ['Arduino', 'C++', 'Blender', 'I2C'],
    slug: 'gyroscope-wand',
    detail: [
      'APS112 (Engineering Strategies & Practice II) design project for a real client: a motion-detecting wand that finds the first responder in Skule™ Kup\'s Discipline Feud games. I wrote the two-wand Arduino firmware and built the Blender prototype. The story, renders, reports, and code live on its own page.',
    ],
  },
  {
    name: 'Holy Bridge — CIV102 Matboard Box Girder',
    date: 'Sep 2025 - Dec 2025',
    stack: ['Structural Design', 'Python', 'Matboard'],
    slug: 'civ102-bridge',
    detail: [
      'A 1,200 mm box girder built from one sheet of matboard and two tubes of contact cement, designed through seven documented iterations with Python-computed load envelopes (predicted failure load 1,096 N). The story, reports, and photos live on its own page.',
    ],
  },
  {
    name: 'Simple Pendulum — PHY180 Analysis',
    date: 'Sep 2025 - Dec 2025',
    stack: ['Experiment', 'Python', 'Data Analysis'],
    slug: 'pendulum',
    detail: [
      'A handmade pendulum measured against theory across four experiments — angle, damping, length, and Q-factor — with Python curve-fitting and full uncertainty propagation. The report, graphs, code, and rig live on its own page.',
    ],
  },
  {
    name: 'APS105 — Coding Labs',
    date: 'Jan 2026 - Apr 2026',
    stack: ['C', 'WebAssembly', 'clang'],
    slug: 'aps105-labs',
    detail: [
      "The weekly labs from U of T's introduction to programming, in C: calculations, loops, an elementary cellular automaton, Connect Four, Reversi, and an ER-triage linked list. Each one runs in your browser: a full clang compiler built to WebAssembly compiles and executes the code on the page, so you can edit my submission and press Run. Lives on its own page.",
    ],
  },
];
