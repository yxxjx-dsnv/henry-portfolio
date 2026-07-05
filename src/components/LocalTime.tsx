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
    timers.current.forEach(clearTimeout);
    timers.current = [];
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
          <svg viewBox="0 0 120 20" width="120" height="20">
            {/* departure & arrival landmasses, and the ocean between */}
            <path className="fm-land" d="M0 20 L0 17.6 Q5 15.8 10 16.9 Q14 15.6 19 16.6 Q25 15.9 30 17.4 L33 20 Z" />
            <path className="fm-land" d="M120 20 L120 17.4 Q114 15.7 109 16.8 Q104 15.7 99 16.7 Q93 16.1 87 17.6 L84 20 Z" />
            <path className="fm-sea" d="M42 17.8 q3 -1.7 6 0 M56 17.8 q3 -1.7 6 0 M70 17.8 q3 -1.7 6 0" />
            <path className="fm-route" d="M 6 14 Q 60 -4 114 14" />
            <circle className="fm-origin" cx={flight === 'east' ? 6 : 114} cy="14" r="2" />
            <circle className="fm-dest" cx={flight === 'east' ? 114 : 6} cy="14" r="2" />
            {/* the plane rides the arc itself; the nose follows the tangent */}
            <g className="fm-plane">
              <path d="M 4.8 0 L -3.2 2.5 L -1.1 0 L -3.2 -2.5 Z" />
              <animateMotion
                dur="1.05s"
                begin="0.05s"
                fill="freeze"
                rotate="auto"
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.4 0 0.6 1"
                keyPoints="0;1"
                path={flight === 'east' ? 'M 6 14 Q 60 -4 114 14' : 'M 114 14 Q 60 -4 6 14'}
              />
            </g>
          </svg>
        </span>
      )}
    </button>
  );
}
