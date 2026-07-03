import { useEffect, useState } from 'react';

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// A quiet "Toronto — 14:32" line that ticks once a minute, aligned to the
// minute boundary so it never shows a stale time.
export function LocalTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  if (!time) return null;
  return <p className="sidebar-time">Toronto — {time}</p>;
}
