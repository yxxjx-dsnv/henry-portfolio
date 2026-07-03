export type LinkedLine = {
  prefix: string;
  link?: { label: string; url?: string };
  suffix?: string;
};

export type ResumeLine = LinkedLine & {
  date: string;
  detail?: string[];
};

export type Activity = ResumeLine;

export type EducationEntry = {
  program: string; // e.g. "Electrical & Computer Engineering (ECE) - BASc"
  date: string;
  term?: string; // year/semester label shown on the right, e.g. "Year 1 · Fall"
  muted?: boolean; // a non-academic interlude (e.g. military service) — rendered faded
};

export type EducationGroup = {
  school: { name: string; url: string };
  degree?: string; // e.g. "Bachelor of Applied Science in Engineering"
  years?: string; // overall span shown on the right, e.g. "2025 – 2029"
  entries: EducationEntry[]; // newest first
};

export type Project = {
  name: string;
  date: string; // e.g. "2026" or "May 2026 - Present"
  stack?: string[]; // e.g. ["Next.js", "TypeScript"]
  link?: { label: string; url: string };
  detail?: string[]; // hover-expand description paragraphs
};
