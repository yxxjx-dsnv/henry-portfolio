// "Sep 2025 - present" -> "1 yr 10 mo" (relative to now). Returns null when
// the string doesn't parse as a month-range — callers then show nothing.
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parsePoint(s: string, now: Date): Date | null {
  const t = s.trim().toLowerCase();
  if (t === 'present' || t === 'now') return now;
  const my = t.match(/^([a-z]{3,9})\s+(\d{4})$/);
  if (my && MONTHS[my[1].slice(0, 3)] !== undefined) {
    return new Date(Number(my[2]), MONTHS[my[1].slice(0, 3)], 1);
  }
  const y = t.match(/^(\d{4})$/);
  if (y) return new Date(Number(y[1]), 0, 1);
  return null;
}

export function durationLabel(range: string, now: Date = new Date(), lang: 'en' | 'ko' = 'en'): string | null {
  const parts = range.split(/\s[-–]\s/);
  if (parts.length !== 2) return null;
  const start = parsePoint(parts[0], now);
  const end = parsePoint(parts[1].replace(/\(.*\)$/, '').trim(), now);
  if (!start || !end || end < start) return null;
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const yr = Math.floor(months / 12);
  const mo = months % 12;
  if (lang === 'ko') return yr === 0 ? `${mo}개월` : mo === 0 ? `${yr}년` : `${yr}년 ${mo}개월`;
  if (yr === 0) return `${mo} mo`;
  if (mo === 0) return `${yr} yr`;
  return `${yr} yr ${mo} mo`;
}
