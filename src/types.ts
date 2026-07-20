export type LinkedLine = {
  prefix: string;
  link?: { label: string; url?: string };
  suffix?: string;
};

export type ResumeLine = LinkedLine & {
  date: string;
  detail?: string[];
};

export type Activity = ResumeLine & {
  slug?: string; // has a full story page at /extra-curricular/<slug>
};

export type EducationEntry = {
  program: string; // e.g. "Electrical & Computer Engineering (ECE) - BASc"
  date: string;
  term?: string; // year/semester label shown on the right, e.g. "Year 1 · Fall"
  muted?: boolean; // a non-academic interlude (e.g. military service) — rendered faded
  detail?: string[]; // the course list, one per line
  lead?: string; // a summary line shown first, set off with a gap (an award, a GPA)
  projects?: string; // a projects line shown last, set off with a gap
};

// A supporting PDF for a school (an offer letter, a scholarship notice). Served
// from /media/education; personal data is redacted from the published copy.
export type EducationDoc = {
  title: string;
  meta: string; // small right-hand label, e.g. "March 25, 2025 · 2 pages"
  file: string; // filename under /media/education
};

export type EducationGroup = {
  school: { name: string; url: string; logo?: string };
  degree?: string; // e.g. "Bachelor of Applied Science in Engineering"
  years?: string; // overall span shown on the right, e.g. "2025 – 2029"
  entries: EducationEntry[]; // newest first
  docs?: EducationDoc[]; // offer/scholarship letters, shown as a doc shelf under the school
};

export type Project = {
  name: string;
  date: string; // e.g. "2026" or "May 2026 - Present"
  stack?: string[]; // e.g. ["Next.js", "TypeScript"]
  link?: { label: string; url: string };
  detail?: string[]; // hover-expand description paragraphs
  slug?: string; // has a full story page at /projects/<slug>
};
