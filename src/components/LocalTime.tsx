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
    timers.current.push(setTimeout(() => setCity(next), 550)); // swap mid-flight
    timers.current.push(setTimeout(() => setFlight(null), 1200));
  };

  if (!time) return null;
  return (
    <button type="button" className="sidebar-time" title="Switch city" onClick={fly}>
      <span className={`time-label${flight ? ' is-swapping' : ''}`}>
        {CITIES[city].label} — {time}
      </span>
      {flight && (
        <span className={`flight-map flight-${flight}`} aria-hidden="true">
          <svg viewBox="0 0 120 16" width="120" height="16">
            <path className="fm-route" d="M 5 13 Q 60 -6 115 13" />
            <circle className="fm-origin" cx={flight === 'east' ? 5 : 115} cy="13" r="2.2" />
            <circle className="fm-dest" cx={flight === 'east' ? 115 : 5} cy="13" r="2.2" />
          </svg>
          <span className={flight === 'west' ? 'plane-mirror' : undefined}>
            <span className="plane-glyph">✈</span>
          </span>
        </span>
      )}
    </button>
  );
}
