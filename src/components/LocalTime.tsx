import { useEffect, useState } from 'react';

const CITIES = [
  { label: 'Toronto', tz: 'America/Toronto' },
  { label: 'Seoul', tz: 'Asia/Seoul' },
] as const;

const fmtFor = (tz: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true, // "2:32 PM"
  });

// A quiet clock that ticks once a minute. Click it and it flies home:
// Toronto <-> Seoul.
export function LocalTime() {
  const [city, setCity] = useState(0);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = fmtFor(CITIES[city].tz);
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    let interval: ReturnType<typeof setInterval> | undefined;
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, [city]);

  if (!time) return null;
  return (
    <button
      type="button"
      className="sidebar-time"
      title="Switch city"
      onClick={() => setCity((c) => (c + 1) % CITIES.length)}
    >
      {CITIES[city].label} — {time}
    </button>
  );
}
