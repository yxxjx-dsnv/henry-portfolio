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
export type Education = ResumeLine;

export type Project = {
  name: string;
  date: string; // e.g. "2026" or "May 2026 - Present"
  stack?: string[]; // e.g. ["Next.js", "TypeScript"]
  link?: { label: string; url: string };
  detail?: string[]; // hover-expand description paragraphs
};
