import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';
import { DocShelf, type ShelfDoc } from '../components/DocShelf';
import { PdfFlow } from '../components/PdfFlow';

const MEDIA = '/media/pendulum';

const DOCS: ShelfDoc[] = [
  {
    title: 'period-vs-angle.py',
    meta: 'quadratic fit T(θ) · Python · 60 lines',
    file: 'code/pendulum-angle.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-angle.py?raw').then((m) => m.default),
  },
  {
    title: 'time-vs-amplitude.py',
    meta: 'damped-oscillator fit, τ and Q · Python · 63 lines',
    file: 'code/pendulum-amplitude.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-amplitude.py?raw').then((m) => m.default),
  },
  {
    title: 'period-vs-length.py',
    meta: 'power-law fit T = kLⁿ · Python · 35 lines',
    file: 'code/pendulum-length.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-length.py?raw').then((m) => m.default),
  },
  {
    title: 'loglog.py',
    meta: 'linearized log–log fit · Python · 45 lines',
    file: 'code/pendulum-loglog.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-loglog.py?raw').then((m) => m.default),
  },
  {
    title: 'q-factor.py',
    meta: 'Q vs length linear fit · Python · 101 lines',
    file: 'code/pendulum-qfactor.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-qfactor.py?raw').then((m) => m.default),
  },
  {
    title: 'fit_black_box.py',
    meta: 'the shared nonlinear-fitting helper · Python · 117 lines',
    file: 'code/pendulum-fit-black-box.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/pendulum-fit-black-box.py?raw').then((m) => m.default),
  },
];

const BUILD: CarouselSlide[] = [
  {
    src: `${MEDIA}/apparatus.jpg`,
    alt: 'Two views of the handmade pendulum: a plastic protractor taped to an acrylic wrist rest weighted under a laptop, with a black 8-ball keychain hanging as the bob against a lined-paper backdrop.',
    caption: 'The handmade apparatus: an acrylic rest, a protractor, thread, and an 8-ball keychain for a bob.',
    width: 1122,
    height: 660,
  },
  {
    src: `${MEDIA}/pendulum-front.jpg`,
    alt: 'Front view of the pendulum hanging still: the protractor reads the release angle at the pivot, the thread runs down a lined-paper backdrop, and the spherical 8-ball bob hangs at the bottom.',
    caption: 'Front on: the protractor at the pivot, the bob dead centre at rest.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/pendulum-top.jpg`,
    alt: 'Top-down view: a MacBook laid over the acrylic base to weigh it down, with the thread wound around a fixed point and a tape measure and scissors on the desk.',
    caption: 'From above: a 1.5 kg laptop pins the base so the pivot cannot shift.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/pendulum-total.jpg`,
    alt: 'Wide view of the full desk rig: the pendulum on its acrylic backboard, with a phone propped on a box acting as the camera to record each swing.',
    caption: 'The whole rig, with a phone on a box as the camera, shooting 60 frames a second.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/release-setup.jpg`,
    alt: 'A hand holding the bob out at a release angle, with the string length marked in Tracker from 0.05 m to 0.20 m along its length and the release angle read from the protractor.',
    caption: 'A release, with the length scale marked on the string for the analysis.',
    width: 979,
    height: 550,
  },
  {
    src: `${MEDIA}/tracker.jpg`,
    alt: 'A laptop running Tracker software: the pendulum video on the left, and mass-A position-versus-time plots on the right showing the decaying oscillation traced frame by frame.',
    caption: 'Tracker, following the bob frame by frame to recover the decay curve.',
    width: 1200,
    height: 1600,
  },
];

type GraphProps = { src: string; alt: string; caption: string };
function Graph({ src, alt, caption }: GraphProps) {
  return (
    <figure className="story-figure">
      <img src={src} alt={alt} width={1800} height={1620} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Pendulum() {
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="Analysis of a Simple Pendulum" subtitle="PHY180 final report — Fall 2025" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              A solo project by{' '}
              <a
                href="https://www.linkedin.com/in/henry-kim-85b554336/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Henry Kim
              </a>
            </p>
            <p>PHY180, University of Toronto</p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>
              A pendulum is one of the first systems a physics course treats as fully solved:
              small swings, a period that depends only on length, motion that repeats. The point of
              this project was to take that clean story into a real room, with a bob made from a
              keychain and a protractor taped to a shelf, and find exactly where the textbook stops
              being true.
            </p>
            <br />
            <p className="story-head">The question</p>
            <p>
              The simple pendulum is the standard example of simple harmonic motion, but only under
              two conventions: that the swing is small, and that there is no friction. Both are
              approximations, and a real pendulum breaks both. So the project set out to measure
              four things and check each against theory: how the period changes with release angle,
              how the amplitude decays over time, how the period depends on length, and how the
              damping depends on length. Each is a place where the ideal model and a handmade
              pendulum disagree, and measuring that disagreement is the point.
            </p>
            <br />
            <p className="story-head">Building something worth measuring</p>
            <p>
              A measurement is only as honest as the apparatus, so most of the care went there. The
              bob is a spherical metal keychain, about 70 grams, chosen for a high mass-to-surface
              ratio so air resistance stays negligible next to gravity, and for a clearly defined
              centre of mass so the length means something. The string is adjustable at six points,
              tied with knots rather than clips so length cannot slip between runs, and the total
              length from pivot to centre of mass was measured at 22.10 ± 0.05 centimetres. A 1.5
              kilogram laptop sits on the base, not for computing but as ballast, to keep the pivot
              from shifting and to kill the resonance that would otherwise leak energy from the
              pendulum into the desk. Every length carries a ± 0.5 millimetre uncertainty and every
              angle a ± 0.5 degree one, and those numbers are carried through to the end.
            </p>
            <br />
            <FigureCarousel slides={BUILD} label="The handmade pendulum and its measurement rig" />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/swing.mp4`}
                controls
                playsInline
                preload="metadata"
                width={720}
                height={1280}
                aria-label="Video: the pendulum swinging against its measurement backdrop"
              />
              <figcaption>The pendulum in motion, filmed for the frame-by-frame analysis.</figcaption>
            </figure>
            <p>
              Each swing was filmed at 60 frames per second on a phone. Periods were read to the
              millisecond in a video player, and the full decay was traced automatically, frame by
              frame, in Tracker. The pendulum ran for roughly thirteen minutes before it stopped;
              the analysis uses the first two hundred seconds of that, which was as much as the
              tracking software could hold.
            </p>
            <br />
            <p className="story-head">Where the small-angle story ends</p>
            <p>
              The first experiment sweeps the release angle across ±1.4 radians and measures
              the period at each. The clean theory says the period should not depend on angle at
              all. The data say otherwise: a clear upward curve, symmetric about the bottom, fitted
              well by a quadratic in the angle. The fit puts the small-angle period at 0.936 ±
              0.002 seconds, the asymmetry term at essentially zero, and the curvature term at a
              small but firmly positive 0.080 ± 0.002, which is the period growing with the square
              of the angle exactly as the fuller theory predicts.
            </p>
            <br />
            <Graph
              src={`${MEDIA}/graph-angle.jpg`}
              alt="Period vs. Angle graph: measured period against release angle from about −1.4 to 1.4 radians, a symmetric upward U-shaped quadratic best-fit curve through the data with a residuals panel below."
              caption="Period vs. angle. The period is flat only near the bottom; it climbs with the square of the release angle."
            />
            <p>
              The useful output is a boundary. By asking where that curvature term stays smaller
              than the measurement uncertainty, the report puts a number on how small a small angle
              has to be: below about 0.17 radians, or 9.7 degrees. Past that, the flat-period story
              is measurably wrong. The textbook always says small angle and never says how small;
              here I could put a measured number on it.
            </p>
            <br />
            <p className="story-head">Measuring the damping two ways</p>
            <p>
              Nothing swings forever, and the second experiment is about the losing. Released from
              0.52 radians and left alone, the amplitude decays along a clean exponential, the
              signature of a damped harmonic oscillator. Fitting that curve gives a decay constant
              of 178 ± 1 seconds, and from it a quality factor, the number that says how many swings
              the pendulum gets before it forgets its energy, of 597 ± 5.
            </p>
            <br />
            <Graph
              src={`${MEDIA}/graph-amplitude.jpg`}
              alt="Time vs. Amplitude graph: the pendulum's amplitude decaying from about 0.45 to 0.20 radians over 200 seconds along an exponential best-fit curve, with a residuals panel below."
              caption="Amplitude vs. time. The exponential decay is what a damped oscillator does, and its rate sets the Q-factor."
            />
            <p>
              What I like about this section is that the same quantity was found a second, cruder
              way as a check: by counting, by hand, the number of swings until the amplitude fell to
              a set fraction of its start. That manual count gave 592 ± 8, which agrees with the
              curve-fit 597 ± 5 inside the uncertainty. Two independent methods, one automated and
              one done by hand, landing on the same number gave me real confidence it was right.
            </p>
            <br />
            <p className="story-head">The law of length</p>
            <p>
              The third experiment changes the length in six steps from 5 to 30 centimetres and
              measures the period at each, then fits a power law, period proportional to length
              raised to some exponent. The clean theory is exact and famous here: the exponent
              should be one half, and the constant should be 2.0. The measured exponent came out
              0.433 ± 0.004, and a log–log plot, where a power law becomes a straight line, confirmed
              it independently at 0.432 ± 0.005.
            </p>
            <br />
            <Graph
              src={`${MEDIA}/graph-length.jpg`}
              alt="Period vs. Length graph: measured period rising from about 0.55 s at 0.05 m to 1.17 s at 0.30 m along a power-law best-fit curve, with a residuals panel below."
              caption="Period vs. length. The period grows with length, but more slowly than the theoretical square-root law."
            />
            <Graph
              src={`${MEDIA}/graph-loglog.jpg`}
              alt="Log(Period) vs. Log(Length) graph: the same data on logarithmic axes falling on a straight line whose slope is the power-law exponent, with a residuals panel below."
              caption="On log–log axes the power law is a straight line, and its slope reads the exponent directly: 0.432."
            />
            <p>
              An exponent of 0.433 against a theoretical 0.5 is a 13.6 percent miss, which is large
              for a physics lab, and the honest part of the report is explaining it rather than
              hiding it. The cause is the first experiment coming back to matter. The length runs
              were released from 0.52 radians, far outside the 0.17-radian range where the
              small-angle law holds, so the restoring force no longer follows the neat linear form,
              and the period grows with length more slowly than the pure square root. The constant
              k, by contrast, landed at 1.94 ± 0.02 against a theoretical 2.0, off by only about 3
              percent. The two results are consistent with each other: the same broken assumption
              that bends the exponent leaves the constant nearly untouched.
            </p>
            <br />
            <p className="story-head">Damping against length</p>
            <p>
              The last experiment ties the two halves together, measuring the Q-factor at each of
              the six lengths. It rises linearly with length: longer pendulums lose a smaller
              fraction of their energy per swing. Fitting a line and pushing it back through theory
              gives a predicted Q of 594 ± 16, which overlaps the 597 ± 5 measured in the damping
              experiment, so the whole picture closes on itself.
            </p>
            <br />
            <Graph
              src={`${MEDIA}/graph-qfactor.jpg`}
              alt="Q-Factor vs. Length graph: the quality factor rising linearly from about 310 at 0.05 m to 790 at 0.30 m along a straight best-fit line, with a residuals panel below."
              caption="Q-factor vs. length: longer pendulums damp more slowly, and the trend is convincingly linear."
            />
            <p className="story-head">The code</p>
            <p>
              Every graph above is the output of a small Python program that reads the raw
              measurements, fits the model with a nonlinear least-squares routine, propagates the
              uncertainties into the fit parameters, and draws the figure with its residuals. The
              five scripts and the shared fitting helper open right here, in full.
            </p>
            <br />
            <DocShelf docs={DOCS} base={MEDIA} />
            <p className="story-head">The report itself</p>
            <p>
              The full six-page report is the real record, and it reads here without leaving the
              page.
            </p>
            <br />
            <PdfFlow src={`${MEDIA}/final-report.pdf`} title="PHY180 Final Report" />
            <p className="story-head">What it taught me, and where it lives</p>
            <p>
              The part of this project I care about is that it is honest about its own
              imperfection. The headline result, an exponent of 0.433 where theory says 0.5, is a
              miss, and the value of the work is that it can say precisely why: a single
              approximation, small angle, quietly violated across a whole experiment, bending every
              downstream number in a predictable direction. Learning to trace an error back to the
              one assumption that caused it, rather than shrugging at the discrepancy, is the actual
              skill physics was teaching.
            </p>
            <br />
            <p>
              The other thing I kept is how much of good measurement is really good design. The
              laptop-as-ballast against resonance, the knots instead of clips, the dense metal bob
              to make air resistance negligible, the two independent ways of finding Q so they could
              check each other: none of that is exotic physics, it is just careful measurement, and
              that habit is what I expect to keep using. A pendulum is a simple system, but a damped
              oscillator with a measurable Q is the same physics as a clock's balance wheel or an
              RLC circuit. Measuring where a clean model stops holding, with real error bars, is the
              part I expect to reuse once the toy is replaced with something that has to work.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
