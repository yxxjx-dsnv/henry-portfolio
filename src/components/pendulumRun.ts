// The lab's moves that need no screen: what counts as letting go, reading a recording on
// demand, one trial with the motion and track the screen shows, and a long run of trials
// a slice at a time so the page keeps answering. PendulumLab.tsx plays them.
import { letGo, protractor, refused, track, type Refusal, type Track } from './pendulumInstruments';
import { swing, type Motion, type Setup } from './pendulumModel';
import { measureLabel, readTrack, secondsFor, trackerOf, type Measure, type Row } from './pendulumBench';
import type { Rng } from './pendulumPhysics';

/** A hand that lets go within this of hanging has only tapped the ball: no release. */
export const MIN_PULL = (2 * Math.PI) / 180;
export const isRelease = (theta: number) => Math.abs(theta) >= MIN_PULL;

type Reading = Pick<Row, 'period' | 'decay' | 'q' | 'envelope'>;

/** Read the recording so far ("measure now"): what it gives, or, if the period or the decay
 *  asked for cannot be read yet, why — and the swing goes on. */
export function readNow(tr: Track, m: Measure, rng?: Rng): Reading | Refusal {
  const r = readTrack(tr, m, rng);
  return [r.period, r.decay].find((x): x is Refusal => !!x && refused(x)) ?? r;
}

/** One trial exactly as trial() runs it (same draws, same row), keeping the motion and the
 *  track so the rig and the plots can show it. */
export function trialRun(s: Setup, m: Measure, rng: Rng | undefined, id: number): { row: Row; motion: Motion; track: Track; seconds: number } {
  const actual = { ...s, theta0: letGo(s.theta0, rng) };
  const seconds = secondsFor(s, m);
  const motion = swing(actual, seconds);
  const tr = track(motion, seconds, trackerOf(m), rng);
  const row: Row = { id, setup: s, angleRead: protractor(s.theta0).value, how: measureLabel(m), byHand: false, ...readTrack(tr, m, rng) };
  return { row, motion, track: tr, seconds };
}

/** Run jobs 0…n−1 in slices of at most `budget` ms (at least one job each), yielding to the
 *  page between slices; `done` after the last. Returns stop(). */
export function runSliced(n: number, job: (i: number) => void, done: () => void, budget = 12): () => void {
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const slice = () => {
    const t0 = performance.now();
    while (i < n) {
      job(i++);
      if (performance.now() - t0 >= budget) break;
    }
    if (i < n) timer = setTimeout(slice, 0);
    else done();
  };
  timer = setTimeout(slice, 0);
  return () => clearTimeout(timer);
}
