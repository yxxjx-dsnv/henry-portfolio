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

const MEDIA = '/media/incheon-robotics';

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
    caption: 'Mounted to the board. Four wheels, no steering — the mecanum hubs handle direction.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/expand-5.jpg`,
    alt: 'The chassis populated with its internals in red and black — the lift mechanism, arms and electronics — with the top deck not yet fitted.',
    caption: 'Populated: lift mechanism, arms, electronics. Everything before the deck goes on.',
    width: 1200,
    height: 900,
  },
  {
    src: `${MEDIA}/r-10.jpg`,
    alt: 'The bare chassis from above with the top plate removed entirely: linear rails, motors, tab arms and the control board laid out inside the frame.',
    caption: 'The same state from above — rails, motors, tab arms, one board.',
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
    caption: 'The scissor at full extension, in elevation — a spring-assisted X under 30 kg.',
    width: 1300,
    height: 700,
  },
  {
    src: `${MEDIA}/r-2.jpg`,
    alt: 'The robot from a high three-quarter angle, the gold-coloured top plate seated flat and its four white tabs extended.',
    caption: 'Deck down, tabs out — the position it drives under a stored bin in.',
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
    caption: 'The smallest configuration that earns its keep: a few levels, one elevator, one kiosk.',
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
    caption: 'Past a certain size the elevators stop being a corner detail and become the plumbing.',
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
    caption: 'And from the side, the thing the density buys: depth, where a conventional rack would have air.',
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
    caption: 'The whole length at once. There is very little in here, which is the design.',
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
            <p>{t("The reason they don't have it is arithmetic. Enterprise ASRS — the AutoStores and Exotecs and Geek+ systems that Amazon-scale operations run on — starts at roughly half a million to a million US dollars, takes three to six months to install, and assumes you have an empty warehouse to install it into. No small operator can stop operations for a season to find out whether it works. So the entire small-and-mid segment, which is about 85% of Korea's logistics centres, gets offered the other option instead: pick-assist robots that follow a worker around. Those are cheap to start, but they keep a person in the loop for every single pick, so the labour cost they were bought to remove is still there.")}</p>
            <br />
            <p>{t("Between the two there is a gap. That gap is the entire company.")}</p>
            <Figure
              src={`${MEDIA}/tower.jpg`}
              alt={t("Render of a full-scale ASRS: a dense multi-storey block of hundreds of blue bins on white posts and wooden tiles, with four elevator towers and a kiosk at the front.")}
              caption={t("What it becomes at scale: bins stacked deep with no aisles at all, elevators at the corners, one kiosk at the front.")}
              width={1600}
              height={991}
            />
            <p className="story-head">No aisles</p>
            <p>{t("A conventional warehouse spends most of its floor on air. Shelves need aisles because people need to walk between them; even a crane-based ASRS needs a channel for the crane. Incheon ASRS deletes the aisle. Bins sit directly beside and on top of each other in a grid, and the robots drive across the top of the structure rather than through it. Nothing walks between the shelves, so nothing needs a gap.")}</p>
            <Figure
              src={`${MEDIA}/carry.jpg`}
              alt={t("Close render from floor level: a robot carrying a blue bin threads between the white support posts of the grid, another robot visible behind it.")}
              caption={t("A loaded robot crossing the grid. The posts around it are the shelving — it drives through the structure, not around it.")}
              width={1800}
              height={1158}
            />
            <p>{t("The structure itself is deliberately unglamorous: melamine-coated tiles, polypropylene node joints with steel inserts, and posts. It ships flat, assembles without a crane or a contractor, and grows tile by tile. You can add a floor by stacking another layer of posts and tiles, or widen the whole thing by laying more tiles beside it — while the system keeps running.")}</p>
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
            <p>{t("Because it is the same handful of parts at every size, the product is really one drawing scaled up and down. A pilot and a full warehouse are the same machine with a different number of tiles in it — which is the whole commercial argument, and much easier to see than to read:")}</p>
            <br />
            <FigureCarousel slides={tr(SCALE)} label={t("From the smallest useful install to a twelve-level warehouse")} />
            <p>{t("How high it can go is a structural question, not a software one, and it gets answered the way structural questions do — by loading the model until it buckles.")}</p>
            <br />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/buckling.mp4`}
                width={1280}
                height={822}
                alt={t("Finite-element animation of the four-level grid under load, playing buckling mode 1 at 5.935 times load and then mode 2 at 6.029 times load, the deformation running from blue at the base through green to yellow.")}
              />
              <figcaption>{t("Both modes in one pass: mode 1 first, at 5.935× the applied load, giving at the top — then mode 2 at 6.029×, a different shape of failure and a slightly higher load to reach it. The clip loops.")}</figcaption>
            </figure>
            <p className="doc-note">
              The solver reports the load multiplier at which each mode goes unstable, and the shape
              it goes unstable in — which is as much a design instruction as a number. The company's
              own study puts the ceiling at:
            </p>
            <Stat value="27 floors" label={t("estimated from the structural buckling analysis — against 24 for AutoStore, 30 for HaiPick, 33 for Exotec")} />
            <p className="story-head">The robot is cheap because the grid is precise</p>
            <p>{t("The most interesting design decision in the product is where the precision lives. An autonomous mobile robot has to know where it is in an open room, which is why it carries lidar and a thousand dollars of sensing. A grid robot does not: the structure already knows where everything is, and the robot only has to follow lines and count tiles. Positional accuracy is absorbed by the infrastructure, so the robot can be simple — line sensing instead of lidar, four mecanum wheels so it can move in any of four directions without turning, a scissor lift with spring assist under a flat plate, and that is nearly the whole machine.")}</p>
            <br />
            <p>{t("Which is how you get to a robot that weighs 8 kg, lifts 30 kg, and draws around 30 watts doing it.")}</p>
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
              Carrying the same 30 kg as a machine eighteen times its weight, on a fraction of the
              power. The bin is a standard 600 × 400 mm Euro container, so nobody has to buy new
              boxes.
            </p>
            <p>{t("Here is that machine on a turntable — modelled in Blender to the company's robot description and photographs, close enough to read the screws. Spin it, run the deck and the tabs, and X-ray the shell:")}</p>
            <br />
            <AsrsRobotInspector />
            <p>{t("And it is worth watching it go together, because there is so little to it: a board, two axle assemblies, a scissor, four tab arms, one control board, and a deck on top.")}</p>
            <br />
            <FigureCarousel slides={tr(BOARD)} label={t("The controller board")} />
            <br />
            <FigureCarousel slides={tr(BUILD)} label={t("The robot, from a bare board to a loaded bin")} />
            <p>{t("And with the shell taken away, the argument for the whole architecture becomes obvious. This is what a robot looks like when the building it drives through is doing the navigating for it.")}</p>
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
              caption={t("And the real one, on real tiles. The four tabs are what a bin sits on; the wheels are mecanum, so it can drive sideways without turning.")}
              width={1600}
              height={1200}
            />
            <p>{t("Getting a bin out is then one motion, repeated all day: arrive under it, square up to the tile, raise the deck, carry, deliver. The grip in the middle of that is the part worth watching: the hub in the centre of the deck turns, and its slots run all four tabs outward together until they sit under the rim of the bin. One motor, one motion, four points of contact — and only then does the scissor take the weight.")}</p>
            <br />
            <p>{t("Rather than describe it, here is the machine itself, rebuilt in 3D for this page. Step through the cycle or let it run, turn it over in your hands, and switch the shell off to see what is doing the work.")}</p>
            <br />
            <AsrsRobotViewer />
            <p className="story-head">Deep-N: thinking in fleets</p>
            <p>{t("Storing bins with no aisles buys density, and density creates the real problem. If the bin you want is ten layers down, a sequential system digs — moves the bin above it, then the one above that, one machine doing one thing at a time — and retrieval time climbs steeply with depth. That is the reason small versions of enterprise ASRS congest so badly: the robots end up queueing on each other.")}</p>
            <br />
            <p>{t("Deep-N is the company's answer, and it is a scheduling idea rather than a mechanical one: several robots clear the stack in parallel and cooperate over who moves what, instead of competing for the same square. It is the piece the company patented, and in testing it reaches a bin buried ten layers deep in about thirty-six seconds.")}</p>
            <Figure
              src={`${MEDIA}/deep-n.jpg`}
              alt={t("Render of four robots on a grid, three carrying blue bins and one empty, with translucent green arrows drawn on the tiles showing the routes they take around each other.")}
              caption={t("Four robots, four routes, one stack being opened. The green is the plan, not the machine.")}
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
              <figcaption>{t("The retrieval running in simulation — Deep 3, from the test series.")}</figcaption>
            </figure>
            <Stat value="80%" label={t("less floor space than a conventional warehouse holding the same goods — the whole point of storing deep, made survivable by the scheduling")} />
            <p className="story-head">Gwangju, December 2025</p>
            <p>{t("None of the above would mean much without a warehouse that runs on it. The first one went live in December 2025 at N09, a logistics operation in Gwangju, under a three-year field-validation agreement — not a demo, but a site that fills orders with this system every day.")}</p>
            <br />
            <p>{t("The numbers from that site are the ones the company leads with, and they are operational rather than technical: the floor went from eighteen operators to six, and the operating margin went from three-to-five per cent to twenty. Average bin retrieval settled around thirty-five seconds.")}</p>
            <Figure
              src={`${MEDIA}/n09.jpg`}
              alt={t("Photograph of the installed system at N09: four levels of white posts and tiles loaded with blue bins, robots parked on the lower tiles, and a black kiosk on a stand at the left with its screen on.")}
              caption={t("N09, as installed. Note the black stand on the left — that kiosk is where my part of the story starts.")}
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
            <p>{t("Here is the thing I find genuinely instructive about this project. The robots got fast, and then the humans became the slow part — not because they are slow, but because of the interface they were given.")}</p>
            <br />
            <p>{t("The kiosk is a touchscreen. To retrieve three items a worker types the first product name, taps retrieve, types the second, taps retrieve, types the third. With a few hundred SKUs that is fine. At five thousand it is not: a single lookup takes about twenty-seven seconds, and it gets worse as the catalogue grows. Two lines from the field validation, quoted in the company's own deck, say it better than any metric:")}</p>
            <br />
            <p>
              {tx('{quoteA} — the N09 logistics manager. And from a worker on the floor: {quoteB}', {
                quoteA: <i>{t('"If we could just organize the SKUs in advance, our daily operations would be so much faster."')}</i>,
                quoteB: <i>{t('"I\'m spending half my time searching for products on the UI screen."')}</i>,
              })}
            </p>
            <br />
            <p>{t("Half their time. On the screen. In front of a warehouse full of robots that are waiting for them.")}</p>
            <p className="story-head">What I was hired to build</p>
            <p>
              {tx('My assignment is the voice layer that removes that screen from the critical path. You say what you need, out loud, the way you would say it to a colleague; the system works out what you meant, and the robots go and get it. Instead of three type-and-tap cycles, one sentence — {quote} — and three bins queue up at the front.', {
                quote: <i>{t('"give me A, B and C"')}</i>,
              })}
            </p>
            <br />
            <VoicePipeline />
            <p>{t("Drawn as a chain it looks tidy, and each link is its own problem. Speech recognition has to work in Korean, on a warehouse floor, with machinery running. The language model has to turn loose human phrasing into exactly one unambiguous instruction — and to refuse, rather than guess, when it cannot. The command that comes out has to be validated and authorised before it reaches the fleet, because at the end of this chain is not a chat window but a thirty-kilogram load moving through a structure with people standing next to it. Then the answer has to come back as speech, so the worker never looks down.")}</p>
            <br />
            <p>{t("The targets are modest to state and hard to hit: product lookup from twenty-seven seconds down to about eight, and retrieval from thirty-five down to around twenty. The kiosk is also meant to learn — placing what gets asked for often nearer the front, so tomorrow's picks are already where they need to be before anyone asks.")}</p>
            <Stat value="27s → 8s" label={t("the lookup this is aimed at, per request, on a floor where a worker was spending half their day on it")} />
            <p className="story-head">And the hardware half</p>
            <p>{t("The other side of the job is the robot build itself. Robotics is not a field you can work on from one end: the voice chain terminates in a motor turning, and the only way to know what the software should promise is to have had a hand in the machine that has to keep the promise. So I'm in the build too — the R&D room in Mapo, where the elevator and lift mechanisms get tested on a bench before they are trusted at height.")}</p>
            <br />
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/lab.mp4`}
                width={1100}
                height={618}
                alt={t("Video of the elevator test rig in the R&D room: an aluminium frame several levels tall with a hoist at the top and a blue bin on one of the shelves.")}
              />
              <figcaption>{t("The elevator rig in the R&D room, being run at bench scale.")}</figcaption>
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
              caption={t("And taken apart, which is where you can see what it actually is: a black frame threaded down through the tile layers. It grows a level whenever the rack does.")}
              width={1500}
              height={929}
            />
            <p>{t("Underneath all of it there is a layer most people never see: the map of the warehouse itself. Every tile has coordinates, a type, and a station; robots are told where home is; a layout gets edited, undone, redone, and submitted, and the fleet rearranges its understanding of the building. Watching someone edit a floor plan and having actual machines change their behaviour is the moment the software stops feeling like software.")}</p>
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
            <p>{t("Incheon Robotics is a foreign-founded company operating in Korea. Its market, its first customer, its trade shows, its regulators and its grant paperwork are all in Korean; a good part of its engineering conversation is not. I am fluent in both, and that turns out to be a job description of its own — the company website, and the company's communication with everyone outside the building.")}</p>
            <br />
            <p>{t("I did not expect that to be the part I would be glad about. But a warehouse robot is bought by a person who has to be convinced first, and no amount of thirty-six-second retrieval helps if the explanation never lands. The distance between an engineering idea and the person it is meant for is a real distance, and closing it is real work.")}</p>
            <p className="story-head">Run the whole thing yourself</p>
            <p>{t("And here is where all of the pieces above stop being pictures. Two storage levels on their cradles, three robots, the elevator, the kiosk — the scene from the company's renders, rebuilt as a working simulation. The robots run the real cycle: drive under a bin, grip, lift it off its cradle, ride the elevator down if it came from an upper deck, present it at the picking station, and shelve it somewhere new.")}</p>
            <br />
            <p>{t("The part I find worth watching is the traffic. Each robot routes with A* around whatever squares the others are holding, so no two ever cross or share a tile — and when two do end up nose to nose, one of them steps aside. Telemetry reads out over the viewport the way an engineering tool would show it. Press run, ask it for a bin, and use X-ray to follow a single robot with its shell taken off.")}</p>
            <br />
            <AsrsSim />
            <p className="story-head">The product film</p>
            <p>{t("The company's own English product video, if you'd rather see the whole thing move than read about it. Four and a half minutes.")}</p>
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
              <figcaption>{t("Incheon ASRS — the product film (English).")}</figcaption>
            </figure>
            <p className="story-head">Day one</p>
            <p>{t("I am nineteen, in my second year of Electrical & Computer Engineering, and I have been here for a day. Everything above is what the company had built before I walked in; the voice chain is the part that does not exist yet, which is exactly why it is the part I was given.")}</p>
            <br />
            <p>{t("What I want from this is narrow and specific: to have shipped something that a person on a warehouse floor uses without thinking about it, and to be able to point at a robot and say I know why it does that. I'll keep this page honest as that happens — including the parts that turn out to be harder than they look on a diagram.")}</p>
            <br />
            <p className="doc-note">
              Written on my own time, from the company's public materials and my own work. Nothing
              here is confidential — no source, no costs, no customers beyond the deployment
              Incheon Robotics publishes itself. Any opinions are mine.
            </p>
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
