import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { useLang } from '../i18n';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';
import { AutoVideo } from '../components/AutoVideo';
import { VoicePipeline } from '../components/VoicePipeline';
import { AsrsRobotViewer } from '../components/AsrsRobotViewer';
import { AsrsRobotInspector } from '../components/AsrsRobotInspector';
import { AsrsSim } from '../components/AsrsSim';
import { DocShelf, type ShelfDoc } from '../components/DocShelf';

const MEDIA = '/media/incheon-robotics';

// The 모두의 창업 application as submitted — one long page, captured from the form.
const DOCS: ShelfDoc[] = [
  { title: '모두의 창업 application', meta: 'as submitted · Korean · 1 long page', file: 'modu-changup-application.pdf', kind: 'pdf' },
];

// The company's own build-up of the machine, in the order it goes together,
// merged with the CAD studies of the finished robot. One sequence, no repeats.
const BUILD: CarouselSlide[] = [
  {
    src: `${MEDIA}/expand-1.jpg`,
    alt: 'CAD render of a plain rectangular board with four rounded corner cut-outs and small red registration marks, alone on a grey background.',
    caption: 'It starts as a board. This is the floor of the robot, drilled and nothing else.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/expand-3.jpg`,
    alt: 'Two axle assemblies floating on a grey background, each a black motor housing on a shaft with a pale wheel at one end.',
    caption: 'Two axle assemblies: a motor, a shaft, a wheel at each end. That is the drivetrain.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/expand-2.jpg`,
    alt: 'The board with the two axle assemblies mounted across it, four wheels now standing proud of its edges.',
    caption: 'Mounted to the board. Four wheels and no steering; the mecanum hubs handle direction.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/expand-5.jpg`,
    alt: 'The chassis populated with its internals in red and black (the lift mechanism, arms and electronics), the top deck not yet fitted.',
    caption: 'Populated: lift mechanism, arms, electronics. Everything before the deck goes on.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/r-10.jpg`,
    alt: 'The bare chassis from above with the top plate removed entirely: linear rails, motors, tab arms and the control board laid out inside the frame.',
    caption: 'The same state from above: rails, motors, tab arms, one board.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/expand-7.jpg`,
    alt: 'The robot with its blue top deck floating a short distance above the chassis, the internals visible in the gap.',
    caption: 'The deck, floating where it will sit.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/r-4.jpg`,
    alt: 'The robot with its top plate raised clear of the chassis, the lifting cross visible beneath it and the four tabs extended.',
    caption: 'Deck on and raised, tabs out. Everything between deck and wheels is the lift.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-5.jpg`,
    alt: 'Side elevation of the robot with the scissor mechanism extended, holding the flat deck above the chassis on an X-shaped linkage.',
    caption: 'The scissor at full extension, in elevation: a spring-assisted X under 30 kg.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-2.jpg`,
    alt: 'The robot from a high three-quarter angle, the gold-coloured top plate seated flat and its four white tabs extended.',
    caption: 'Deck down, tabs out: the position it drives under a stored bin in.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-3.jpg`,
    alt: 'Plan view looking straight down on the robot: a cross-shaped top plate with four white tabs projecting from its sides and a disc at the centre.',
    caption: 'Straight down: the cross, and the four tabs a bin actually rests on.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-7.jpg`,
    alt: 'Exploded view of the plate assembly, the four tab arms fanned out around the central hub that drives them.',
    caption: 'The tabs exploded off their hub. One hub drives all four, so they move together or not at all.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-9.jpg`,
    alt: 'Low three-quarter view of the robot with the deck tilted up and away, exposing the drive motors and the underside of the plate.',
    caption: 'From underneath: the drive motors, and the wheels they turn.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-1.jpg`,
    alt: 'Clean CAD render of the finished robot: a low black chassis with a flat grey top plate, a blue disc at its centre, and four wheels.',
    caption: 'Assembled. Eight kilograms, and nothing on it that is not load-bearing.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/expand-6.jpg`,
    alt: 'The finished robot with a blue Euro container resting on its raised deck.',
    caption: 'Loaded: one standard 600 × 400 mm Euro container, up to 30 kg of it.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/r-12.jpg`,
    alt: 'The loaded robot seen square-on from the front, the bin resting level on the raised deck.',
    caption: 'Square-on. The bin never tilts; the deck does the work.',
    width: 1300,
    height: 700,
  },
];

// The same product, drawn at every size it is sold in — the argument for the
// modular structure is easier to see than to read.
const SCALE: CarouselSlide[] = [
  {
    src: `${MEDIA}/scale-2.jpg`,
    alt: 'A small installation: five levels of grid holding blue bins, an elevator tower at one corner, a kiosk on a stand beside it, and a row of bins on the ground tiles at the front.',
    caption: 'The smallest configuration: a few levels, one elevator, one kiosk.',
    width: 1300,
    height: 805,
  },
  {
    src: `${MEDIA}/scale-3.jpg`,
    alt: 'A larger installation seen from the front corner, with a wide apron of ground tiles carrying outbound bins and two elevator towers behind.',
    caption: 'Lay more tiles beside it and the front apron grows with it.',
    width: 1300,
    height: 805,
  },
  {
    src: `${MEDIA}/scale-5.jpg`,
    alt: 'A wide, dense installation of blue bins on white posts, viewed almost square-on, with two elevator towers rising through it.',
    caption: 'Square-on: rows of bins with no aisle anywhere in the picture.',
    width: 1300,
    height: 805,
  },
  {
    src: `${MEDIA}/scale-6.jpg`,
    alt: 'A dense block of stored bins across many levels, with elevator towers at intervals and a kiosk at the near corner.',
    caption: 'Past a certain size the elevators are spaced through the block, not only at the corners.',
    width: 1300,
    height: 805,
  },
  {
    src: `${MEDIA}/scale-7.jpg`,
    alt: 'A tall installation around twelve levels high and many bays deep, packed with blue bins, two elevator towers running its full height.',
    caption: 'Twelve levels. The same tile, the same post, the same robot.',
    width: 1300,
    height: 805,
  },
  {
    src: `${MEDIA}/scale-8.jpg`,
    alt: 'The tall installation from a second angle, showing its depth: layer upon layer of bins receding into the frame.',
    caption: 'From the side, what the density buys: depth where a conventional rack would have air.',
    width: 1300,
    height: 805,
  },
];

// The same machine with its shell made transparent.
// The controller board, v11 — the one board the robot runs on, both sides.
const BOARD: CarouselSlide[] = [
  {
    src: `${MEDIA}/pcb-front.jpg`,
    alt: 'The front of the green Incheon Robotics PCB v11: an STM32F446 microcontroller at the centre, four small motor-driver chips along the top, an nRF52840 radio module at the bottom left, white JST plugs on the left and right edges labelled WHEEL RR, RL, FR, FL, black IDC headers labelled SENSOR, green screw terminals labelled ENC, GRIP and LIFT, and a barrel jack labelled BATTERY 3S.',
    caption:
      'The controller, v11. Centre: an STM32F446 (ARM Cortex-M4). Top row: four A4950 H-bridges, one per wheel. Bottom left: an nRF52840 radio module. White JST plugs for the four wheel motors, IDC headers for the IR sensor arrays, screw terminals for the encoders, gripper and lift, and a 3S battery jack.',
    width: 1400,
    height: 980,
  },
  {
    src: `${MEDIA}/pcb-back.jpg`,
    alt: 'The back of the same PCB: the Incheon Robotics wordmark and logo in white silkscreen, and lines of text in Chinese characters, Sanskrit, Malayalam and Korean around the edges.',
    caption:
      'The back, which is not engineering: the company mark, the four-line verse of impermanence from the Nirvana Sutra, a Sanskrit prayer, a dedication in Malayalam, and in Korean, "after hardship comes joy".',
    width: 1400,
    height: 980,
  },
];

const GHOST: CarouselSlide[] = [
  {
    src: `${MEDIA}/robot-ghost.jpg`,
    alt: 'Ghosted CAD render of the robot in three-quarter view, the shell transparent so the linear rails, drive motors, control board and scissor mechanism show through.',
    caption: 'Three-quarter, shell made transparent: rails, motors, board, mechanism.',
    width: 1600,
    height: 850,
  },
  {
    src: `${MEDIA}/ghost-2.jpg`,
    alt: 'Ghosted side elevation of the robot with the scissor collapsed flat, showing how little vertical room the mechanism occupies.',
    caption: 'Collapsed, in elevation. Folded flat it is barely taller than its own wheels.',
    width: 1600,
    height: 850,
  },
  {
    src: `${MEDIA}/ghost-4.jpg`,
    alt: 'A wide ghosted view of the robot showing the full internal layout across its length.',
    caption: 'The whole length at once. There is very little in here.',
    width: 1600,
    height: 850,
  },
];

type FigureProps = { src: string; alt: string; caption: string; width: number; height: number };

function Figure({ src, alt, caption, width, height }: FigureProps) {
  return (
    <figure className="story-figure">
      <img src={src} alt={alt} width={width} height={height} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <p className="ir-figure-line">
      <b>{value}</b>
      <span>{label}</span>
    </p>
  );
}

export function IncheonRobotics() {
  const { t, tx } = useLang();
  const tr = (slides: CarouselSlide[]) => slides.map((sl) => ({ ...sl, alt: t(sl.alt), caption: t(sl.caption) }));
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="Incheon ASRS" subtitle="Incheon Robotics — from August 10, 2026" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              AI/Robotics Engineering Intern at{' '}
              <a href="https://incheonrobotics.com" target="_blank" rel="noopener noreferrer">
                Incheon Robotics
              </a>{' '}
              (주식회사 인천로보틱스) · Incheon Global Campus, Songdo
            </p>
            <p>Voice AI on the kiosk · robot build · the Korean-language half of the company</p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <Figure
              src={`${MEDIA}/hero.jpg`}
              alt={t("Render from floor level inside the ASRS: a low black-and-blue robot sits on a white tiled grid between rows of white support columns, another robot carrying a blue bin behind it.")}
              caption={t("Floor level, inside the grid. Everything above these tiles is storage; the robots live on top of it.")}
              width={1800}
              height={1158}
            />
            <p>{t("On August 10, 2026 I started as an AI/Robotics Engineering Intern at Incheon Robotics, a warehouse-robotics company at the Incheon Global Campus in Songdo, with an R&D room in Mapo, Seoul. I work under the direct supervision of the CEO. This page is what the company builds, why the machine is shaped the way it is, and the piece of it I was hired to make.")}</p>
            <br />
            <p className="story-head">The problem is not that they don't want it</p>
            <p>{t("Walk into a small third-party logistics warehouse in Korea and you will find fifteen people walking aisles all day, reading labels, putting things into cardboard boxes. Labour costs go up every year. Everyone in the building knows automation exists.")}</p>
            <br />
            <p>{t("The reason they don't have it is arithmetic. Enterprise ASRS (AutoStore, Exotec, Geek+, the systems Amazon-scale operations run on) starts at roughly half a million to a million US dollars, takes three to six months to install, and assumes an empty warehouse to install it into. No small operator can stop for a season to find out whether it works. So the small and mid segment, about 85% of Korea's logistics centres, gets offered pick-assist robots that follow a worker around instead. Those are cheap to start, but a person is still in the loop for every pick, so the labour cost they were bought to remove is still there. Incheon Robotics sells into the space between those two options.")}</p>
            <Figure
              src={`${MEDIA}/tower.jpg`}
              alt={t("Render of a full-scale ASRS: a dense multi-storey block of hundreds of blue bins on white posts and wooden tiles, with four elevator towers and a kiosk at the front.")}
              caption={t("What it becomes at scale: bins stacked deep with no aisles at all, elevators at the corners, one kiosk at the front.")}
              width={1600}
              height={991}
            />
            <p className="story-head">No aisles</p>
            <p>{t("A conventional warehouse spends most of its floor on air. Shelves need aisles because people need to walk between them; even a crane-based ASRS needs a channel for the crane. Incheon ASRS deletes the aisle. Bins sit directly beside and on top of each other in a grid, and the robots drive across the top of the structure. Nothing walks between the shelves, so nothing needs a gap.")}</p>
            <Figure
              src={`${MEDIA}/carry.jpg`}
              alt={t("Close render from floor level: a robot carrying a blue bin threads between the white support posts of the grid, another robot visible behind it.")}
              caption={t("A loaded robot crossing the grid. The posts around it are the shelving.")}
              width={1800}
              height={1158}
            />
            <p>{t("The structure is plain: melamine-coated tiles, polypropylene node joints with steel inserts, and posts. It ships flat, assembles without a crane or a contractor, and grows tile by tile. You add a floor by stacking another layer of posts and tiles, or widen it by laying more tiles beside it, while the system keeps running.")}</p>
            <Figure
              src={`${MEDIA}/grid.jpg`}
              alt={t("Clean CAD render of four levels of the bare grid: white tiles held apart by white posts and star-shaped node joints, no bins loaded.")}
              caption={t("The structure with nothing in it: tiles, posts, and node joints. The tile is the unit of the whole product.")}
              width={1400}
              height={867}
            />
            <Figure
              src={`${MEDIA}/exploded.jpg`}
              alt={t("Exploded CAD view on a dark background: layers of tiles and posts separated vertically, with the elevator frame lifted off the top.")}
              caption={t("The same thing pulled apart. Everything in the picture is one of four or five repeated parts.")}
              width={1600}
              height={991}
            />
            <p>{t("Because it is the same handful of parts at every size, a pilot and a full warehouse are the same machine with a different number of tiles in it. That is the commercial argument, and it is easier to see than to read:")}</p>
            <br />
            <FigureCarousel slides={tr(SCALE)} label={t("From the smallest useful install to a twelve-level warehouse")} />
            <p>{t("How high it can go is a structural question, answered by loading the model until it buckles.")}</p>
            <br />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/buckling.mp4`}
                width={1280}
                height={822}
                alt={t("Finite-element animation of the four-level grid under load, playing buckling mode 1 at 5.935 times load and then mode 2 at 6.029 times load, the deformation running from blue at the base through green to yellow.")}
              />
              <figcaption>{t("Both modes in one pass: mode 1 first, at 5.935× the applied load, giving at the top, then mode 2 at 6.029×, a different shape of failure at a slightly higher load. The clip loops.")}</figcaption>
            </figure>
            <p className="doc-note">
              {t("The solver reports the load multiplier at which each mode goes unstable, and the shape it goes unstable in, which is as useful as the number. The company's own study puts the ceiling at:")}
            </p>
            <Stat value="27 floors" label={t("estimated from the buckling analysis; AutoStore 24, HaiPick 30, Exotec 33")} />
            <p className="story-head">The robot is cheap because the grid is precise</p>
            <p>{t("The design decision I find most interesting is where the precision lives. An autonomous mobile robot has to know where it is in an open room, which is why it carries lidar and a thousand dollars of sensing. A grid robot does not: the structure already knows where everything is, and the robot only has to follow lines and count tiles. So the robot can be simple: line sensors instead of lidar, four mecanum wheels so it can move in any of four directions without turning, and a spring-assisted scissor lift under a flat plate. That is nearly the whole machine.")}</p>
            <br />
            <p>{t("The result weighs 8 kg, lifts 30 kg, and draws around 30 watts doing it.")}</p>
            <div className="ir-spec">
              <table>
                <thead>
                  <tr>
                    <th>&nbsp;</th>
                    <th className="ir-spec-ours">Incheon ASRS</th>
                    <th>AutoStore R5</th>
                    <th>Amazon Kiva</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Robot weight</td>
                    <td className="ir-spec-ours">8 kg</td>
                    <td>148 kg</td>
                    <td>110 kg</td>
                  </tr>
                  <tr>
                    <td>Max load</td>
                    <td className="ir-spec-ours">30 kg</td>
                    <td>30 kg</td>
                    <td>450 kg (with pod)</td>
                  </tr>
                  <tr>
                    <td>Speed</td>
                    <td className="ir-spec-ours">1.5 m/s</td>
                    <td>3.1 m/s</td>
                    <td>1.3 m/s</td>
                  </tr>
                  <tr>
                    <td>Power draw</td>
                    <td className="ir-spec-ours">~30 W</td>
                    <td>100 W</td>
                    <td>400–500 W</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="doc-note">
              {t('Carrying the same 30 kg as a machine eighteen times its weight, on a fraction of the power. The bin is a standard 600 × 400 mm Euro container, so nobody has to buy new boxes.')}
            </p>
            <p>{t("I modelled the robot in Blender from the company's robot description and photographs, close enough to read the screws. Spin it, run the deck and the tabs, and X-ray the shell:")}</p>
            <br />
            <AsrsRobotInspector />
            <p>{t("There is not much to it: a board, two axle assemblies, a scissor, four tab arms, one control board, and a deck on top.")}</p>
            <br />
            <FigureCarousel slides={tr(BOARD)} label={t("The controller board")} />
            <br />
            <FigureCarousel slides={tr(BUILD)} label={t("The robot, from a bare board to a loaded bin")} />
            <p>{t("With the shell off: this is what a robot looks like when the building it drives through does the navigating for it.")}</p>
            <br />
            <FigureCarousel slides={tr(GHOST)} label={t("The robot with its shell made transparent")} />
            <Figure
              src={`${MEDIA}/ghost-3.jpg`}
              alt={t("Ghosted plan view looking straight down through the robot, showing the drive belt loop running its length, the motors at the corners and the wiring between them.")}
              caption={t("Straight down through the deck: the belt loop, the corner drives, and the wiring between them.")}
              width={900}
              height={1849}
            />
            <Figure
              src={`${MEDIA}/robot-real.jpg`}
              alt={t("Photograph of the actual robot sitting on the grid tiles: a grey top plate with a blue centre disc, four aluminium tabs projecting from the sides, and mecanum wheels visible at the corners.")}
              caption={t("The real one, on real tiles. The four tabs are what a bin sits on; the wheels are mecanum, so it can drive sideways without turning.")}
              width={1600}
              height={1200}
            />
            <p>{t("Getting a bin out is one sequence, repeated all day: arrive under it, square up to the tile, raise the deck, carry, deliver. The grip is the part I like: the hub in the centre of the deck turns, and its slots run all four tabs outward together until they sit under the rim of the bin. One motor moves all four, and only then does the scissor take the weight.")}</p>
            <br />
            <p>{t("The same cycle, in 3D. Step through it or let it run, and switch the shell off to see what is doing the work.")}</p>
            <br />
            <AsrsRobotViewer />
            <p className="story-head">Deep-N: thinking in fleets</p>
            <p>{t("Storing bins with no aisles buys density, and density brings its own problem. If the bin you want is ten layers down, a sequential system digs: it moves the bin above it, then the one above that, one machine doing one thing at a time, and retrieval time climbs steeply with depth. That is why small versions of enterprise ASRS congest so badly: the robots end up queueing on each other.")}</p>
            <br />
            <p>{t("Deep-N, the company's answer, is software: several robots clear the stack in parallel and agree on who moves what, so they are not competing for the same square. It is the piece the company patented. In testing it reaches a bin buried ten layers deep in about thirty-six seconds.")}</p>
            <Figure
              src={`${MEDIA}/deep-n.jpg`}
              alt={t("Render of four robots on a grid, three carrying blue bins and one empty, with translucent green arrows drawn on the tiles showing the routes they take around each other.")}
              caption={t("Four robots opening one stack. The green arrows are the planned routes.")}
              width={1600}
              height={991}
            />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/deep3.mp4`}
                width={1280}
                height={676}
                alt={t("Simulation of the Deep-N retrieval running: coloured bins moving across a grid as several robots clear a stack together.")}
              />
              <figcaption>{t("The retrieval in simulation: Deep 3, from the test series.")}</figcaption>
            </figure>
            <Stat value="80%" label={t("less floor space than a conventional warehouse holding the same goods; that is what storing deep buys, and the scheduling is what makes it workable")} />
            <p className="story-head">Gwangju, December 2025</p>
            <p>{t("The first warehouse running on it went live in December 2025 at N09, a logistics operation in Gwangju, under a three-year field-validation agreement. It fills real orders with this system every day.")}</p>
            <br />
            <p>{t("The numbers the company leads with come from that site: the floor went from eighteen operators to six, operating margin from three to five per cent to twenty, and average bin retrieval settled around thirty-five seconds.")}</p>
            <Figure
              src={`${MEDIA}/n09.jpg`}
              alt={t("Photograph of the installed system at N09: four levels of white posts and tiles loaded with blue bins, robots parked on the lower tiles, and a black kiosk on a stand at the left with its screen on.")}
              caption={t("N09, as installed. The black stand on the left is the kiosk, which is where my part starts.")}
              width={1200}
              height={1598}
            />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/demo.mp4`}
                width={1280}
                height={720}
                alt={t("Video of the installed system running: robots moving across the loaded grid and lifting bins.")}
              />
              <figcaption>{t("The system running.")}</figcaption>
            </figure>
            <p className="story-head">The bottleneck nobody designed for</p>
            <p>{t("The robots got fast, and then the interface the workers were given became the slow part.")}</p>
            <br />
            <p>{t("The kiosk is a touchscreen. To retrieve three items a worker types the first product name, taps retrieve, types the second, taps retrieve, types the third. With a few hundred SKUs that is fine. At five thousand, a single lookup takes about twenty-seven seconds, and it gets worse as the catalogue grows. Two lines from the field validation, quoted in the company's deck:")}</p>
            <br />
            <p>
              {tx('{quoteA} (the N09 logistics manager). {quoteB} (a worker on the floor).', {
                quoteA: <i>{t('"If we could just organize the SKUs in advance, our daily operations would be so much faster."')}</i>,
                quoteB: <i>{t('"I\'m spending half my time searching for products on the UI screen."')}</i>,
              })}
            </p>
            <p className="story-head">What I was hired to build</p>
            <p>
              {tx('My assignment is the voice layer that takes that screen out of the loop. You say what you need out loud, the way you would to a colleague; the system works out what you meant, and the robots go and get it. Instead of three type-and-tap cycles, one sentence, {quote}, and three bins queue up at the front.', {
                quote: <i>{t('"give me A, B and C"')}</i>,
              })}
            </p>
            <br />
            <VoicePipeline />
            <p>{t("Drawn as a chain it looks tidy. Each link is its own problem. Speech recognition has to work in Korean on a warehouse floor with machinery running. The language model has to turn loose phrasing into exactly one instruction, and refuse when it cannot instead of guessing. The command has to be validated and authorised before it reaches the fleet, because what is at the end of this chain is a thirty-kilogram load moving through a structure with people standing next to it. Then the answer has to come back as speech, so the worker never looks down.")}</p>
            <br />
            <p>{t("The targets: product lookup from twenty-seven seconds down to about eight, and retrieval from thirty-five down to around twenty. The kiosk is also meant to learn, moving what gets asked for often nearer the front so tomorrow's picks are already close.")}</p>
            <Stat value="27s → 8s" label={t("the lookup target, per request")} />
            <p className="story-head">And the hardware half</p>
            <p>{t("The other half of the job is the robot build. The voice chain ends in a motor turning, and to know what the software can promise I need to have had a hand in the machine that has to keep the promise. So I'm in the build too, in the R&D room in Mapo, where the elevator and lift mechanisms get tested on a bench before they are trusted at height.")}</p>
            <br />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/lab.mp4`}
                width={1100}
                height={618}
                alt={t("Video of the elevator test rig in the R&D room: an aluminium frame several levels tall with a hoist at the top and a blue bin on one of the shelves.")}
              />
              <figcaption>{t("The elevator rig in the R&D room, at bench scale.")}</figcaption>
            </figure>
            <Figure
              src={`${MEDIA}/elevator.jpg`}
              alt={t("CAD render of the elevator module: a tall black-framed tower standing on the tile grid with a blue bin at its base.")}
              caption={t("The same module in CAD, assembled: a black frame standing on the tiles, a bin at its foot.")}
              width={1000}
              height={931}
            />
            <Figure
              src={`${MEDIA}/exploded-2.jpg`}
              alt={t("Exploded CAD view on a dark background showing the elevator's black frame lifted clear of two separated tile layers, its posts running down through both of them.")}
              caption={t("Taken apart: a black frame threaded down through the tile layers. It grows a level whenever the rack does.")}
              width={1500}
              height={929}
            />
            <p>{t("Underneath all of it is the map of the warehouse. Every tile has coordinates, a type and a station; robots are told where home is; a layout gets edited, undone, redone and submitted, and the fleet updates its picture of the building. Someone edits the floor plan and real machines change what they do. That still surprises me.")}</p>
            <br />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/map-editor.mp4`}
                width={1440}
                height={810}
                alt={t("Screen recording of the fleet map editor: a grid of numbered tiles with coordinates, a properties panel showing tile 455 at location 0, -2, 0 with robot_home true, and undo, redo and submit controls.")}
              />
              <figcaption>{t("The map editor: tiles, coordinates, stations, and which square the robot calls home.")}</figcaption>
            </figure>
            <p className="story-head">The half of the job that isn't engineering</p>
            <p>{t("Incheon Robotics is a foreign-founded company operating in Korea. Its market, its first customer, its trade shows, its regulators and its grant paperwork are all in Korean; much of its engineering conversation is not. I am fluent in both, so that is a job of its own: the company website, and the company's communication with everyone outside the building.")}</p>
            <br />
            <p>{t("I did not expect to be glad about that part. But a warehouse robot is bought by a person who has to be convinced first, and thirty-six-second retrieval does not help if the explanation never lands.")}</p>
            <p className="story-head">Run the whole thing yourself</p>
            <p>{t("The scene from the company's renders, rebuilt as a working simulation: two storage levels on their cradles, three robots, the elevator, the kiosk. The robots run the real cycle: drive under a bin, grip, lift it off its cradle, ride the elevator down if it came from an upper deck, present it at the picking station, and shelve it somewhere new.")}</p>
            <br />
            <p>{t("The traffic is the part I watch. Each robot routes with A* around whatever squares the others are holding, so no two cross or share a tile, and when two end up nose to nose one steps aside. Telemetry reads out over the viewport. Press run, ask it for a bin, and use X-ray to follow one robot with its shell off.")}</p>
            <br />
            <AsrsSim />
            <p className="story-head">The product film</p>
            <p>{t("The company's own product video, in English. Four and a half minutes.")}</p>
            <br />
            <figure className="story-figure">
              <video
                src={`${MEDIA}/product.mp4`}
                poster={`${MEDIA}/product-poster.jpg`}
                preload="none"
                controls
                playsInline
                width={1120}
                height={630}
                aria-label={t("Incheon ASRS product video, in English")}
              />
              <figcaption>{t("Incheon ASRS product film (English).")}</figcaption>
            </figure>
            <p className="story-head">Day one</p>
            <p>{t("I am nineteen, in my second year of Electrical & Computer Engineering, and I have been here for a day. Everything above is what the company had built before I walked in. The voice chain does not exist yet, which is why it is the part I was given.")}</p>
            <br />
            <p>{t("What I want from this: to have shipped something a person on a warehouse floor uses without thinking about it, and to be able to point at a robot and say I know why it does that. I'll update this page as that happens, including the parts that turn out harder than they look on a diagram.")}</p>
            <br />
            <p className="story-head">Five weeks in: an application, and a demo to go with it</p>
            <p>{t("The company was applying to 모두의 창업, a government startup programme, and the second-round submission came to me: ten answers in Korean, a character limit on each, and a video. A colleague had drafted the boxes. I rewrote them end to end — same facts, less padding — filled each one to its limit, and submitted it on 17 September 2026.")}</p>
            <br />
            <p>{t("For the video the ask was a staged demo: read a script out loud while the robots run a fixed route, the way a product film does. I built it to listen for real instead. Korean speech recognition in the browser, fourteen products printed on the bins, and nothing moves until the operator confirms. It took about the same week to write, and it means the thing in the video is the thing that happened.")}</p>
            <br />
            <p>{tx('The screen copies our kiosk — the status bar, the product cards, the floating voice window with its Korean strings — laid over the simulation further up this page. Say {quote} and the kiosk reads the order back. Press confirm and a robot drives under bin B02, lifts it off its cradle, rides the elevator down and sets it on the picking station. Then it leaves for the next job, and a robot comes back for that bin a few seconds later, because on a real floor somebody has to take the item out first.', {
              quote: <i>{t('"bring me the car shampoo"')}</i>,
            })}</p>
            <br />
            <p>{t("What it is not: the kiosk in the product runs speech through Whisper and a language model, which handles sentences this demo cannot, and the warehouse on screen is a simulation, not the machine in Gwangju. Both are said on screen and in the video description. A demo that overstates itself inside a government application is not a demo, it is a problem.")}</p>
            <br />
            <p>{t("It runs in Chrome, with a microphone. Open it, press the mic and ask for something on a bin.")}</p>
            <br />
            <figure className="story-figure model-viewer">
              <a className="model-poster" href="https://incheon-asrs-voice-demo.vercel.app" target="_blank" rel="noopener noreferrer">
                <img
                  src={`${MEDIA}/voice-demo.jpg`}
                  alt={t("The voice demo: the kiosk's status bar across the top, product cards down the right, the voice assistant window at the bottom right, and the three-robot rack with labelled bins behind them.")}
                  width={1600}
                  height={900}
                  loading="lazy"
                />
                <span className="model-cta">Open the voice demo ↗</span>
              </a>
              <figcaption>{t("The voice demo, live. It opens in a new tab.")}</figcaption>
            </figure>
            <p>{t("Below is the video that went in with the application, recorded on that demo.")}</p>
            <br />
            <figure className="story-figure">
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                <iframe
                  src="https://www.youtube-nocookie.com/embed/Z_R9Kt0soYg"
                  title={t("Incheon ASRS voice-command prototype, the video submitted with the application")}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                />
              </div>
              <figcaption>{t("The submitted video: the kiosk mock-up and the simulation, driven by voice.")}</figcaption>
            </figure>
            <p>{t("And the application itself, as it was submitted, in Korean.")}</p>
            <DocShelf docs={DOCS.map((d) => ({ ...d, title: t(d.title), meta: t(d.meta) }))} base={MEDIA} />
            <br />
            <p className="doc-note">
              {t("Written on my own time, from the company's public materials and my own work. The 모두의 창업 application and its video are linked as they were submitted; apart from those, nothing here is confidential: no source, no costs, no customers beyond the deployment Incheon Robotics publishes itself. Any opinions are mine.")}
            </p>
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
