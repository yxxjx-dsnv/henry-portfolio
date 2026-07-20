import { useEffect, useMemo, useState } from 'react';

// A faithful client-side port of the Campus Pulse dashboard we built at the
// hackathon (6SIX7). The original ran two feeds: a Python backend that counted
// people from a camera (Rekognition), and a "mock" fallback that jittered demo
// numbers every 3 seconds. A static portfolio can't host the backend, so this
// runs the exact mock feed, plus the same directory -> detail flow, search,
// sort, best-location recommendation and trend logic straight from the source
// (campus-pulse.tsx). Only the presentation is re-done — the original used
// tailwind, framer-motion, recharts and shadcn; here it's plain elements, inline
// SVG and CSS scoped under .cp-dash so the product's colours never leak into the
// mono site.

type OccupancyLevel = 'low' | 'mid' | 'high';
type Trend = 'up' | 'down' | 'stable';
type PageView = 'dashboard' | 'building-detail';

type FloorData = { floor: string; occupancyPercent: number; lastUpdated: string };
type HourlyPoint = { time: string; occupancyPercent: number };
type BuildingData = {
  id: string;
  name: string;
  shortName: string;
  occupancyPercent: number;
  floors: FloorData[];
  hourlyTrend: HourlyPoint[];
  emergency: boolean;
  emergencyMessage?: string;
  statusNote?: string;
  lastUpdated: string;
  services: string[];
  operationHours: string;
  hoursNote?: string;
};

const MOCK_BUILDINGS: BuildingData[] = [
  {
    id: 'robarts-commons',
    name: 'Robarts Commons',
    shortName: 'Robarts',
    occupancyPercent: 82,
    emergency: false,
    statusNote: 'Study spaces filling quickly.',
    lastUpdated: '2 mins ago',
    services: ['Study Space', 'Quiet Zones', 'Group Rooms'],
    operationHours: 'Sun 10AM–12AM • Mon–Thu 24 Hours • Fri 12AM–11PM • Sat 9AM–10PM',
    hoursNote: 'Robarts Common overnight access runs Sunday to Thursday during fall and winter terms.',
    floors: [
      { floor: '1F', occupancyPercent: 58, lastUpdated: '2 mins ago' },
      { floor: '2F', occupancyPercent: 89, lastUpdated: '2 mins ago' },
      { floor: '3F', occupancyPercent: 84, lastUpdated: '2 mins ago' },
      { floor: '4F', occupancyPercent: 41, lastUpdated: '2 mins ago' },
    ],
    hourlyTrend: [
      { time: '8AM', occupancyPercent: 18 },
      { time: '10AM', occupancyPercent: 42 },
      { time: '12PM', occupancyPercent: 63 },
      { time: '2PM', occupancyPercent: 79 },
      { time: '4PM', occupancyPercent: 88 },
      { time: '6PM', occupancyPercent: 83 },
      { time: '8PM', occupancyPercent: 54 },
      { time: '10PM', occupancyPercent: 27 },
    ],
  },
  {
    id: 'gerstein-library',
    name: 'Gerstein Science Information Centre',
    shortName: 'Gerstein',
    occupancyPercent: 37,
    emergency: true,
    emergencyMessage: 'Temporary elevator disruption reported. Use alternate route.',
    statusNote: 'Lower traffic than usual.',
    lastUpdated: '1 min ago',
    services: ['Silent Study', 'Computers', 'Medical Sciences'],
    operationHours: 'Open now; current closing time varies by day',
    hoursNote: 'Gerstein hours are posted weekly on U of T Libraries and can change by date.',
    floors: [
      { floor: '1F', occupancyPercent: 61, lastUpdated: '1 min ago' },
      { floor: '2F', occupancyPercent: 46, lastUpdated: '1 min ago' },
      { floor: '3F', occupancyPercent: 28, lastUpdated: '1 min ago' },
      { floor: '4F', occupancyPercent: 17, lastUpdated: '1 min ago' },
    ],
    hourlyTrend: [
      { time: '8AM', occupancyPercent: 14 },
      { time: '10AM', occupancyPercent: 31 },
      { time: '12PM', occupancyPercent: 44 },
      { time: '2PM', occupancyPercent: 39 },
      { time: '4PM', occupancyPercent: 34 },
      { time: '6PM', occupancyPercent: 28 },
      { time: '8PM', occupancyPercent: 22 },
      { time: '10PM', occupancyPercent: 11 },
    ],
  },
  {
    id: 'bahen-centre',
    name: 'Bahen Centre for Information Technology',
    shortName: 'Bahen',
    occupancyPercent: 64,
    emergency: false,
    statusNote: 'Moderate building traffic.',
    lastUpdated: '3 mins ago',
    services: ['Labs', 'Study Space', 'Lecture Halls'],
    operationHours: 'General access often listed around 8AM–6PM; after-hours access may require authorization',
    hoursNote: 'Bahen access can vary by room, lab, academic schedule, and authorization level.',
    floors: [
      { floor: '1F', occupancyPercent: 73, lastUpdated: '3 mins ago' },
      { floor: '2F', occupancyPercent: 67, lastUpdated: '3 mins ago' },
      { floor: '3F', occupancyPercent: 55, lastUpdated: '3 mins ago' },
      { floor: '4F', occupancyPercent: 48, lastUpdated: '3 mins ago' },
    ],
    hourlyTrend: [
      { time: '8AM', occupancyPercent: 22 },
      { time: '10AM', occupancyPercent: 47 },
      { time: '12PM', occupancyPercent: 56 },
      { time: '2PM', occupancyPercent: 68 },
      { time: '4PM', occupancyPercent: 71 },
      { time: '6PM', occupancyPercent: 58 },
      { time: '8PM', occupancyPercent: 34 },
      { time: '10PM', occupancyPercent: 15 },
    ],
  },
  {
    id: 'sidney-smith',
    name: 'Sidney Smith Hall',
    shortName: 'Sidney Smith',
    occupancyPercent: 29,
    emergency: false,
    statusNote: 'Mostly open right now.',
    lastUpdated: '4 mins ago',
    services: ['Study Area', 'Classrooms', 'Transit Nearby'],
    operationHours: 'Mon–Thu 10AM–6:30PM • Fri 10AM–2PM',
    hoursNote: 'These are Sidney Smith Commons hours on the ground floor, not necessarily the full building.',
    floors: [
      { floor: '1F', occupancyPercent: 35, lastUpdated: '4 mins ago' },
      { floor: '2F', occupancyPercent: 31, lastUpdated: '4 mins ago' },
      { floor: '3F', occupancyPercent: 24, lastUpdated: '4 mins ago' },
      { floor: '4F', occupancyPercent: 18, lastUpdated: '4 mins ago' },
    ],
    hourlyTrend: [
      { time: '8AM', occupancyPercent: 11 },
      { time: '10AM', occupancyPercent: 22 },
      { time: '12PM', occupancyPercent: 29 },
      { time: '2PM', occupancyPercent: 37 },
      { time: '4PM', occupancyPercent: 33 },
      { time: '6PM', occupancyPercent: 24 },
      { time: '8PM', occupancyPercent: 18 },
      { time: '10PM', occupancyPercent: 9 },
    ],
  },
];

function levelFromPercent(percent: number): OccupancyLevel {
  if (percent >= 75) return 'high';
  if (percent >= 40) return 'mid';
  return 'low';
}

function trendFromValues(current: number, average: number): Trend {
  if (current - average >= 8) return 'up';
  if (average - current >= 8) return 'down';
  return 'stable';
}

const LABEL: Record<OccupancyLevel, string> = { low: 'Low', mid: 'Mid', high: 'High' };

function trendMeta(trend: Trend): { label: string; icon: 'up' | 'down' | 'stable' } {
  if (trend === 'up') return { label: 'Increasing', icon: 'up' };
  if (trend === 'down') return { label: 'Decreasing', icon: 'down' };
  return { label: 'Stable', icon: 'stable' };
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function getRoundedCurrentHour() {
  const now = new Date();
  let hour = now.getHours();
  const minutes = now.getMinutes();
  if (minutes >= 30) hour += 1;
  return hour;
}

function timeLabelTo24Hour(label: string) {
  // Handles "9AM", "12PM", "2:30PM", etc.
  const match = label.match(/^(\d+)(?::(\d+))?(AM|PM)$/);
  if (!match) return 0;
  const rawHour = Number(match[1]);
  const meridiem = match[3];
  const hour24 = meridiem === 'AM' ? (rawHour === 12 ? 0 : rawHour) : rawHour === 12 ? 12 : rawHour + 12;
  const minutes = match[2] ? Number(match[2]) / 60 : 0;
  return hour24 + minutes;
}

function getVisibleTrendData(building: BuildingData) {
  if (!building.hourlyTrend.length) return [];
  const roundedHour = getRoundedCurrentHour();
  const visible = building.hourlyTrend.filter((point) => timeLabelTo24Hour(point.time) <= roundedHour);
  // If nothing falls before the current hour (e.g. mock data at midnight), show all points
  return visible.length > 0 ? visible : building.hourlyTrend;
}

function getBestLocationRecommendation(buildings: BuildingData[]) {
  if (!buildings.length) {
    return { buildingName: '-', time: '-', occupancy: 0 };
  }

  const hour = getRoundedCurrentHour();
  const slots = [8, 10, 12, 14, 16, 18, 20, 22];

  let closestSlot = slots[0];
  slots.forEach((slot) => {
    if (Math.abs(slot - hour) < Math.abs(closestSlot - hour)) {
      closestSlot = slot;
    }
  });

  const slotLabelMap: Record<number, string> = {
    8: '8AM',
    10: '10AM',
    12: '12PM',
    14: '2PM',
    16: '4PM',
    18: '6PM',
    20: '8PM',
    22: '10PM',
  };

  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayLabel = `${displayHour}${hour >= 12 ? 'PM' : 'AM'}`;
  const targetLabel = slotLabelMap[closestSlot];

  let bestBuilding = buildings[0];
  let bestOccupancy = 100;

  buildings.forEach((building) => {
    const visiblePoints = getVisibleTrendData(building);
    const point =
      visiblePoints.find((entry) => entry.time === targetLabel) ?? visiblePoints[visiblePoints.length - 1];
    if (point && point.occupancyPercent < bestOccupancy) {
      bestOccupancy = point.occupancyPercent;
      bestBuilding = building;
    }
  });

  return { buildingName: bestBuilding.shortName, time: displayLabel, occupancy: bestOccupancy };
}

const clamp = (n: number) => Math.max(5, Math.min(96, n));

// Mirrors the original useBuildingData() mock feed: every 3s it jitters each
// building by up to ±6, each floor by up to ±7, each trend point by up to ±4,
// and stamps everything "Just now". Reduced-motion visitors get a still snapshot.
function useBuildingData() {
  const [buildings, setBuildings] = useState<BuildingData[]>(MOCK_BUILDINGS);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const refreshFromMock = () => {
    setBuildings((current) =>
      current.map((building) => {
        const buildingDelta = Math.floor(Math.random() * 13) - 6;
        return {
          ...building,
          occupancyPercent: clamp(building.occupancyPercent + buildingDelta),
          lastUpdated: 'Just now',
          floors: building.floors.map((floor) => ({
            ...floor,
            occupancyPercent: clamp(floor.occupancyPercent + (Math.floor(Math.random() * 15) - 7)),
            lastUpdated: 'Just now',
          })),
          hourlyTrend: building.hourlyTrend.map((point) => ({
            ...point,
            occupancyPercent: clamp(point.occupancyPercent + (Math.floor(Math.random() * 9) - 4)),
          })),
        };
      }),
    );
    setLastRefresh(formatClock(new Date()));
  };

  useEffect(() => {
    setLastRefresh(formatClock(new Date()));
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(refreshFromMock, 3000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { buildings, lastRefresh, refreshNow: refreshFromMock };
}

function Icon({ name }: { name: string }) {
  const p = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'search':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case 'back':
      return (
        <svg {...p}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...p}>
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...p}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      );
    case 'up':
      return (
        <svg {...p}>
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      );
    case 'down':
      return (
        <svg {...p}>
          <path d="m3 7 6 6 4-4 8 8" />
          <path d="M17 17h4v-4" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M5 12h14" />
        </svg>
      );
  }
}

function StatusPill({ level }: { level: OccupancyLevel }) {
  return (
    <span className={`cp-pill cp-${level}`}>
      <span className={`cp-dot cp-dot-${level}`} aria-hidden="true" />
      {LABEL[level]}
    </span>
  );
}

function TrendPill({ trend }: { trend: Trend }) {
  const meta = trendMeta(trend);
  return (
    <span className="cp-trendpill">
      <Icon name={meta.icon} />
      {meta.label}
    </span>
  );
}

function BestLocationBanner({ buildings }: { buildings: BuildingData[] }) {
  const recommendation = useMemo(() => getBestLocationRecommendation(buildings), [buildings]);
  return (
    <div className="cp-best">
      <div className="cp-best-k">Best location recommendation</div>
      <div className="cp-best-row">
        <span className="cp-best-name">{recommendation.buildingName}</span>
        <span className="cp-best-when">best around {recommendation.time}</span>
        <span className="cp-best-est">Current best estimate: {recommendation.occupancy}%</span>
      </div>
      <div className="cp-best-note">Recommended location based on occupancy data.</div>
    </div>
  );
}

function BuildingDirectoryCard({ building, onClick }: { building: BuildingData; onClick: () => void }) {
  return (
    <button type="button" className="cp-row" onClick={onClick}>
      <span className="cp-row-l">
        <span className="cp-row-name">{building.shortName}</span>
        <span className="cp-row-full">{building.name}</span>
        <span className="cp-row-hours">{building.operationHours}</span>
      </span>
      <span className="cp-row-r">
        <span className="cp-row-num">
          <span className="cp-big">{building.occupancyPercent}%</span>
          <span className="cp-updated">Updated {building.lastUpdated}</span>
        </span>
        <StatusPill level={levelFromPercent(building.occupancyPercent)} />
      </span>
    </button>
  );
}

function FloorCard({ floor, updated }: { floor: FloorData; updated: string }) {
  const level = levelFromPercent(floor.occupancyPercent);
  return (
    <div className="cp-floor">
      <div className="cp-floor-top">
        <div>
          <div className="cp-floor-kicker">Floor</div>
          <div className="cp-floor-name">{floor.floor}</div>
        </div>
        <StatusPill level={level} />
      </div>
      <div className="cp-floor-mid">
        <div>
          <span className="cp-floor-pct">{floor.occupancyPercent}%</span>
          <span className="cp-updated">Updated {updated}</span>
        </div>
        <span className="cp-density">Density</span>
      </div>
      <div className="cp-bar">
        <div className={`cp-bar-fill cp-${level}`} style={{ width: `${floor.occupancyPercent}%` }} />
      </div>
    </div>
  );
}

function OccupancyTrendChart({ building }: { building: BuildingData }) {
  const points = useMemo(() => getVisibleTrendData(building), [building]);
  const [hover, setHover] = useState<number | null>(null);

  const W = 620;
  const H = 240;
  const padL = 40;
  const padR = 14;
  const padT = 14;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = points.length;
  const x = (i: number) => (n <= 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW);
  const y = (p: number) => padT + (1 - p / 100) * innerH;
  const line = points.map((pt, i) => `${x(i)},${y(pt.occupancyPercent)}`).join(' ');

  // Snap to the nearest hour from the pointer's x — so a hover anywhere on the
  // plot (or a touch scrub on a phone) tracks the line, like the original
  // recharts tooltip did, instead of only lighting up right on a data point.
  const pick = (clientX: number, rect: DOMRect) => {
    if (!rect.width || n <= 1) return 0;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((svgX - padL) / innerW) * (n - 1));
    return Math.max(0, Math.min(n - 1, i));
  };

  return (
    <svg className="cp-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Today's occupancy trend by hour">
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line className="cp-grid" x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} />
          <text className="cp-axis" x={padL - 8} y={y(g) + 3} textAnchor="end">
            {g}%
          </text>
        </g>
      ))}

      {hover !== null && (
        <line className="cp-cross" x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} />
      )}

      <polyline className="cp-line" points={line} />

      {points.map((pt, i) => (
        <text key={pt.time} className="cp-axis" x={x(i)} y={H - 10} textAnchor="middle">
          {pt.time}
        </text>
      ))}

      {hover !== null && (
        <circle
          className="cp-pt on"
          cx={x(hover)}
          cy={y(points[hover].occupancyPercent)}
          r={4.5}
          pointerEvents="none"
        />
      )}

      {hover !== null &&
        (() => {
          const pt = points[hover];
          const bw = 118;
          const bh = 40;
          const flip = x(hover) + 12 + bw > W - padR;
          const bx = flip ? x(hover) - 12 - bw : x(hover) + 12;
          const by = Math.max(padT, Math.min(y(pt.occupancyPercent) - bh / 2, padT + innerH - bh));
          return (
            <g className="cp-tip-g" pointerEvents="none">
              <rect className="cp-tip-box" x={bx} y={by} width={bw} height={bh} rx={7} />
              <text className="cp-tip-time" x={bx + 12} y={by + 16}>
                {pt.time}
              </text>
              <text className="cp-tip-val" x={bx + 12} y={by + 31}>
                Occupancy : {pt.occupancyPercent}%
              </text>
            </g>
          );
        })()}

      <rect
        className="cp-hit"
        x={0}
        y={0}
        width={W}
        height={H}
        style={{ touchAction: 'pan-y' }}
        onMouseMove={(e) => setHover(pick(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => setHover(pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()))}
        onTouchMove={(e) => setHover(pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect()))}
        onTouchEnd={() => setHover(null)}
      />
    </svg>
  );
}

function BuildingDetailPage({ building, onBack }: { building: BuildingData; onBack: () => void }) {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const floorAverage =
    building.floors.reduce((sum, floor) => sum + floor.occupancyPercent, 0) /
    Math.max(1, building.floors.length);
  const level = levelFromPercent(building.occupancyPercent);

  return (
    <div className="cp-detail">
      <div className="cp-detail-top">
        <div>
          <h3 className="cp-detail-h">{building.name}</h3>
          <p className="cp-detail-sub">Live building info, floor density, and daily trend.</p>
        </div>
        <button type="button" className="cp-btn" onClick={onBack}>
          <Icon name="back" /> Back
        </button>
      </div>

      <div className="cp-hero">
        <div className="cp-hero-l">
          <span className="cp-hero-updated">
            <Icon name="clock" /> Updated {building.lastUpdated}
          </span>
          <h4 className="cp-hero-name">{building.shortName}</h4>
          <p className="cp-hero-note">
            {building.statusNote ?? 'Live building density and service status overview.'}
          </p>
          <div className="cp-services">
            {building.services.map((service) => (
              <span className="cp-chip" key={service}>
                {service}
              </span>
            ))}
          </div>
        </div>
        <div className="cp-hero-r">
          <div className="cp-hero-k">Current occupancy</div>
          <div className="cp-hero-big">{building.occupancyPercent}%</div>
          <div className="cp-hero-pills">
            <StatusPill level={level} />
            <TrendPill trend={trendFromValues(building.occupancyPercent, floorAverage)} />
          </div>
        </div>
      </div>

      {building.emergency && (
        <div className="cp-alert" role="status">
          <Icon name="alert" />
          <div>
            <strong>Emergency / service alert</strong>
            <div className="cp-alert-msg">
              {building.emergencyMessage ?? 'An emergency has been reported in this building.'}
            </div>
          </div>
        </div>
      )}

      <div className="cp-hours">
        <span className="cp-hours-ic" aria-hidden="true">
          <Icon name="clock" />
        </span>
        <div>
          <div className="cp-hours-k">Operating hours</div>
          <div className="cp-hours-v">{building.operationHours}</div>
          {building.hoursNote ? <div className="cp-hours-note">{building.hoursNote}</div> : null}
        </div>
      </div>

      <div className="cp-panel">
        <div className="cp-panel-head">
          <div>
            <span className="cp-panel-title">Floor Details</span>
            <span className="cp-panel-sub">Per-floor density snapshot for the selected building.</span>
          </div>
          <div className="cp-toggle" role="group" aria-label="View">
            <button type="button" className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>
              Cards
            </button>
            <button type="button" className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>
              Table
            </button>
          </div>
        </div>

        {view === 'cards' ? (
          <div className="cp-floors">
            {building.floors.map((floor) => (
              <FloorCard key={floor.floor} floor={floor} updated={floor.lastUpdated} />
            ))}
          </div>
        ) : (
          <table className="cp-table">
            <thead>
              <tr>
                <th>Floor</th>
                <th>Status</th>
                <th>Occupancy</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {building.floors.map((floor) => {
                const fl = levelFromPercent(floor.occupancyPercent);
                return (
                  <tr key={floor.floor}>
                    <td>{floor.floor}</td>
                    <td>
                      <StatusPill level={fl} />
                    </td>
                    <td>{floor.occupancyPercent}%</td>
                    <td className="cp-td-muted">{floor.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="cp-panel">
        <div className="cp-panel-head">
          <div>
            <span className="cp-panel-title">Today&rsquo;s Occupancy Trend</span>
            <span className="cp-panel-sub">See when this building is busier or quieter during the day.</span>
          </div>
        </div>
        <OccupancyTrendChart building={building} />
      </div>
    </div>
  );
}

export function CampusPulseDash() {
  const { buildings, lastRefresh, refreshNow } = useBuildingData();
  const [page, setPage] = useState<PageView>('dashboard');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'crowded' | 'quiet' | 'alphabetical'>('crowded');
  const [selectedId, setSelectedId] = useState<string>(MOCK_BUILDINGS[0].id);

  const filteredBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = buildings.filter(
      (building) =>
        !query ||
        building.name.toLowerCase().includes(query) ||
        building.shortName.toLowerCase().includes(query),
    );

    const sorted = [...filtered];
    if (sort === 'crowded') sorted.sort((a, b) => b.occupancyPercent - a.occupancyPercent);
    if (sort === 'quiet') sorted.sort((a, b) => a.occupancyPercent - b.occupancyPercent);
    if (sort === 'alphabetical') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [buildings, search, sort]);

  useEffect(() => {
    if (!filteredBuildings.some((building) => building.id === selectedId) && filteredBuildings[0]) {
      setSelectedId(filteredBuildings[0].id);
    }
  }, [filteredBuildings, selectedId]);

  const selectedBuilding =
    buildings.find((building) => building.id === selectedId) ?? filteredBuildings[0] ?? buildings[0];

  const alerts = useMemo(() => buildings.filter((building) => building.emergency), [buildings]);

  return (
    <div className="cp-dash">
      <span className="cp-try">
        <span className="cp-try-dot" aria-hidden="true" /> Try it yourself
      </span>

      <div className="cp-head">
        <div className="cp-brandbox">
          <span className="cp-logo" aria-hidden="true">
            CP
          </span>
          <span className="cp-brandtext">
            <span className="cp-kicker">UofT Smart Campus</span>
            <span className="cp-brand">Campus Pulse</span>
          </span>
        </div>
        <div className="cp-head-r">
          <button type="button" className="cp-btn" onClick={refreshNow}>
            <Icon name="refresh" /> Refresh
          </button>
          <span className="cp-demo" title="Running the mock feed — the live camera backend isn't hosted here.">
            demo data{lastRefresh ? ` · ${lastRefresh}` : ''}
          </span>
        </div>
      </div>

      <h3 className="cp-title">Live Campus Occupancy Dashboard</h3>
      <p className="cp-lede">
        Building-level crowd status and floor-by-floor density. Designed for quick scanning and
        one-click building details.
      </p>

      <BestLocationBanner buildings={buildings} />

      {alerts.length > 0 && (
        <div className="cp-alert" role="status">
          <Icon name="alert" />
          <div>
            <strong>Active building alerts</strong>
            <div className="cp-alert-msg">
              {alerts
                .map(
                  (building) =>
                    `${building.shortName}: ${building.emergencyMessage ?? 'Emergency reported.'}`,
                )
                .join(' • ')}
            </div>
          </div>
        </div>
      )}

      {page === 'building-detail' && selectedBuilding ? (
        <BuildingDetailPage building={selectedBuilding} onBack={() => setPage('dashboard')} />
      ) : (
        <div className="cp-directory">
          <div className="cp-dir-head">
            <span className="cp-panel-title">Building Directory</span>
            <span className="cp-panel-sub">
              Choose a building to see its information page, floor details, and daily trend.
            </span>
          </div>

          <div className="cp-controls">
            <label className="cp-searchwrap">
              <span className="cp-search-ic" aria-hidden="true">
                <Icon name="search" />
              </span>
              <input
                className="cp-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search supported buildings"
                aria-label="Search supported buildings"
              />
            </label>
            <select
              className="cp-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'crowded' | 'quiet' | 'alphabetical')}
              aria-label="Sort buildings"
            >
              <option value="crowded">Most crowded</option>
              <option value="quiet">Least crowded</option>
              <option value="alphabetical">A → Z</option>
            </select>
          </div>

          <div className="cp-legend">
            <span className="cp-leg">
              <span className="cp-dot cp-dot-low" /> Low
            </span>
            <span className="cp-leg">
              <span className="cp-dot cp-dot-mid" /> Mid
            </span>
            <span className="cp-leg">
              <span className="cp-dot cp-dot-high" /> High
            </span>
          </div>

          <div className="cp-list">
            {filteredBuildings.map((building) => (
              <BuildingDirectoryCard
                key={building.id}
                building={building}
                onClick={() => {
                  setSelectedId(building.id);
                  setPage('building-detail');
                }}
              />
            ))}
            {filteredBuildings.length === 0 && (
              <div className="cp-empty">No buildings match your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
