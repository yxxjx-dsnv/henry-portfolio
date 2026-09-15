import { useLang } from '../i18n';
// The kiosk voice chain, drawn rather than described: what a spoken request
// passes through on its way to a robot, and what comes back. It runs downward
// because the reading column is narrow — five stages side by side would need
// scrolling to read at all. Inline SVG, so it takes the page's own colours in
// both themes; the flowing dashes are CSS and stop under prefers-reduced-motion.

type Stage = {
  title: string;
  sub: string;
  note: string;
  mono?: boolean; // the note is a command, not prose
};

const X = 18;
const W = 452;
const H = 84;
const GAP = 34;
const TOP = 92;

const STAGES: Stage[] = [
  { title: 'Kiosk', sub: 'voice in', note: 'push-to-talk, no typing' },
  { title: 'Speech → text', sub: 'ASR', note: 'Korean, over a running warehouse' },
  { title: 'Text → intent', sub: 'LLM', note: 'which bins, how many, in what order' },
  {
    title: 'Intent → command',
    sub: 'Robot API',
    note: '{ "action": "retrieve", "bins": ["A12","B07"] }',
    mono: true,
  },
  { title: 'Command → motion', sub: 'Fleet', note: 'robots dispatched, queued at the station' },
];

const top = (i: number) => TOP + i * (H + GAP);
const RAIL = X + W + 30;
const VB_H = top(STAGES.length - 1) + H + 52;

export function VoicePipeline() {
  const { t } = useLang();
  return (
    <figure className="story-figure ir-pipe-fig">
      <div className="ir-pipe-wrap">
        <svg
          className="ir-pipe"
          viewBox={`0 0 ${RAIL + 26} ${VB_H}`}
          role="img"
          aria-label={t("The kiosk voice chain: a spoken request becomes text, then intent, then a validated command to the robot fleet, and a spoken confirmation returns to the kiosk.")}
        >
          <title>Kiosk voice chain</title>

          <text className="ir-pipe-caption" x={X} y="26">
            SPOKEN REQUEST
          </text>
          <text className="ir-pipe-quote" x={X} y="54">
            &ldquo;Get me A, B and C&rdquo;
          </text>
          <line className="ir-pipe-flow" x1={X + 12} y1="64" x2={X + 12} y2={TOP - 4} />
          <path className="ir-pipe-head" d={`M${X + 8} ${TOP - 9} l4 5 4 -5`} />

          {STAGES.map((s, i) => {
            const y = top(i);
            return (
              <g key={s.title}>
                <rect className="ir-pipe-box" x={X} y={y} width={W} height={H} rx="10" />
                <text className="ir-pipe-idx" x={X + 18} y={y + 26}>
                  {String(i + 1).padStart(2, '0')}
                </text>
                <text className="ir-pipe-sub" x={X + W - 18} y={y + 26} textAnchor="end">
                  {s.sub}
                </text>
                <text className="ir-pipe-title" x={X + 18} y={y + 52}>
                  {s.title}
                </text>
                <text
                  className={s.mono ? 'ir-pipe-code' : 'ir-pipe-note'}
                  x={X + 18}
                  y={y + 72}
                >
                  {s.note}
                </text>
                {i < STAGES.length - 1 && (
                  <>
                    <line
                      className="ir-pipe-flow"
                      x1={X + 30}
                      y1={y + H + 2}
                      x2={X + 30}
                      y2={y + H + GAP - 8}
                    />
                    <path
                      className="ir-pipe-head"
                      d={`M${X + 26} ${y + H + GAP - 13} l4 5 4 -5`}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* the answer, climbing back up the outside to the person who asked */}
          <g className="ir-pipe-return">
            <path
              className="ir-pipe-flow ir-pipe-flow-back"
              d={`M${X + W + 2} ${top(STAGES.length - 1) + H / 2} L${RAIL} ${top(STAGES.length - 1) + H / 2} L${RAIL} ${top(0) + H / 2} L${X + W + 8} ${top(0) + H / 2}`}
            />
            <path className="ir-pipe-head" d={`M${X + W + 13} ${top(0) + H / 2 - 4} l-5 4 5 4`} />
            <text
              className="ir-pipe-back-label"
              transform={`rotate(-90 ${RAIL + 16} ${(top(0) + top(STAGES.length - 1) + H) / 2})`}
              x={RAIL + 16}
              y={(top(0) + top(STAGES.length - 1) + H) / 2}
              textAnchor="middle"
            >
              status → speech
            </text>
          </g>

          <text className="ir-pipe-caption" x={X} y={VB_H - 30}>
            SPOKEN BACK
          </text>
          <text className="ir-pipe-quote ir-pipe-quote-small" x={X} y={VB_H - 8}>
            &ldquo;Heading to bin A12&rdquo;
          </text>
        </svg>
      </div>
      <figcaption>{t("The chain I was hired to build: a spoken request in Korean, a fleet of robots moving at the end of it, and a spoken answer on the way back — so the worker never looks down at a screen.")}</figcaption>
    </figure>
  );
}
