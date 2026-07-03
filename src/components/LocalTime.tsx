import { useEffect, useRef, useState } from 'react';

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

// A quiet clock that ticks once a minute. Click it and a plane crosses:
// Seoul -> Toronto flies eastward (left to right), Toronto -> Seoul flies
// westward (right to left) — as it does over the globe.
export function LocalTime() {
  const [city, setCity] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [flight, setFlight] = useState<'east' | 'west' | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const fly = () => {
    if (flight) return; // one plane at a time
    const next = (city + 1) % CITIES.length;
    // to Toronto = eastward (left->right); to Seoul = westward (right->left)
    setFlight(CITIES[next].label === 'Toronto' ? 'east' : 'west');
    timers.current.push(setTimeout(() => setCity(next), 300));
    timers.current.push(setTimeout(() => setFlight(null), 700));
  };

  if (!time) return null;
  return (
    <button type="button" className="sidebar-time" title="Switch city" onClick={fly}>
      <span className={`time-label${flight ? ' is-swapping' : ''}`}>
        {CITIES[city].label} — {time}
      </span>
      {flight && (
        <span className={`plane plane-${flight}`} aria-hidden="true">
          ✈
        </span>
      )}
    </button>
  );
}
