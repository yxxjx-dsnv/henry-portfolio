import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';
import { DocShelf, type ShelfDoc } from '../components/DocShelf';
import { PdfDeck } from '../components/PdfDeck';
import { ModelViewer } from '../components/ModelViewer';
import firmwareSource from '../assets/two-wand-system.ino?raw';

const MEDIA = '/media/gyroscope-wand';

// The slides we presented to the client on April 9th, 2026. One literal note
// per slide, in the order they were shown.
const DECK_NOTES = [
  'Title slide: Buzzer Beaters, Team 13, presented to client Alexandre Klaus on April 9th.',
  'The course disclaimer: a first-year student design, not a professional engineering submission.',
  'The agenda: problem, proposed design, key objectives, iteration, next steps.',
  'The proposed design: the Skule™ Wand, effective, feasible, and efficient.',
  'How it works: swing the wand, pass the motion threshold, your LED lights and the others lock out.',
  'The five objectives, with targets: lightweight, compact, impact resistant, structurally resilient, durable.',
  'All five objectives, checked off against the built wand system.',
  'Measure of Success: the drop test and weight. 92% functional, 89% physical condition, 83% operational.',
  'Compact enough to be carry-on: the packed system is 200 by 300 by 230 mm.',
  'What testing exposed: the clear acrylic sphere cracked during the drop test.',
  'The iteration: the old acrylic model beside the new polycarbonate one.',
  'Why we switched: polycarbonate is more impact resistant than acrylic.',
  'Next steps: put the wand into Discipline Feud and support more hardware and wireless connections.',
  'Takeaway: feasible, meets the objectives, confirmed by MoS, and iterated after testing.',
  'Thank you, and questions.',
  'References.',
  'Appendix: the threshold logic, in the firmware itself, that decides which wand moved first.',
  'Appendix: the flowchart of how the system identifies the first responder.',
  'Appendix: the Measure of Success success-rate calculations.',
];

const TEAM = [
  { name: 'Kamilia Desroches Parchment', url: 'https://www.linkedin.com/in/kamilia-desroches-parchment-8703a8368/' },
  { name: 'Omotayo Faseemo', url: 'https://www.linkedin.com/in/omotayo-faseemo-of1/' },
  { name: 'Abdulrahman Abuloghod', url: 'https://www.linkedin.com/in/abdulrahman-abuloghod/' },
  { name: 'Merrick Wang', url: 'https://www.linkedin.com/in/merrick-wang-38295a360/' },
  { name: 'Shannon Ho', url: null },
];

const DOCS: ShelfDoc[] = [
  { title: 'Project Requirements (PR)', meta: 'March 3, 2026 · 28 pages', file: 'pr.pdf', kind: 'pdf' },
  { title: 'Conceptual Design Specification (CDS)', meta: 'March 22, 2026 · 95 pages', file: 'cds.pdf', kind: 'pdf' },
  { title: 'Team Feedback Analysis', meta: 'April 6, 2026 · 7 pages', file: 'team-feedback-analysis.pdf', kind: 'pdf' },
  { title: 'Engineering Notebook', meta: 'Winter 2026 · 16 pages', file: 'engineering-notebook.pdf', kind: 'pdf' },
  { title: 'Two_wand_system.ino', meta: 'Arduino C++ · 493 lines', file: 'two-wand-system.ino.txt', kind: 'code', lang: 'cpp', source: firmwareSource },
];

const WAND_DESIGN: CarouselSlide[] = [
  {
    src: `${MEDIA}/cds-fig-1.png`,
    alt: 'CDS system diagram of the Skule Wand: LED first-responder indicator, motion sensor capturing angular velocity, hub box, and USB link to the computer.',
    caption: 'The Skule™ Wand, end to end: sensor, hub, screen.',
    width: 1600,
    height: 745,
  },
  {
    src: `${MEDIA}/cds-fig-2.png`,
    alt: 'CDS drawing of the wand central hub interior: the I2C multiplexer wired to an Arduino-based central unit.',
    caption: 'The central hub: the multiplexer feeding the Arduino.',
    width: 1600,
    height: 895,
  },
  {
    src: `${MEDIA}/cds-fig-3.png`,
    alt: 'Hand-drawn dimensioned wand from the CDS: an 80 mm globe with the flask topper on a 150 mm PETG grip.',
    caption: 'The wand, dimensioned: an 80 mm globe on a 150 mm PETG grip.',
    width: 1101,
    height: 1600,
  },
];

const HARDHAT_DESIGN: CarouselSlide[] = [
  {
    src: `${MEDIA}/cds-fig-4.png`,
    alt: 'CDS drawing of the hard-hat concept: eight hard hats arranged around a central operating system connected to a laptop.',
    caption: 'The hard-hat concept: eight helmets reporting to one central unit.',
    width: 1562,
    height: 1600,
  },
  {
    src: `${MEDIA}/cds-fig-7.png`,
    alt: 'CDS drawing of a hard hat from above, with a buzzer pod attached by velcro and an example discipline logo sticker.',
    caption: 'The buzzer pod sits on the helmet crown, with a discipline sticker.',
    width: 1600,
    height: 986,
  },
  {
    src: `${MEDIA}/cds-fig-8.png`,
    alt: 'CDS drawing of the buzzer pod interior: a force-sensitive resistor inside a polycarbonate shell with a velcro base.',
    caption: 'Inside the pod: a force-sensitive resistor reads the tap.',
    width: 1600,
    height: 1259,
  },
  {
    src: `${MEDIA}/cds-fig-6.png`,
    alt: 'Dimensioned CDS drawing of a standard hard hat with a viscoelastic polyurethane foam insert.',
    caption: 'Padding spec for the helmet mount.',
    width: 1600,
    height: 869,
  },
  {
    src: `${MEDIA}/cds-fig-5.png`,
    alt: "CDS drawing of the hard-hat concept's central unit: a polycarbonate enclosure holding an ESP32 dev board, a mini speaker, and a breadboard, linked to a laptop over Bluetooth.",
    caption: "The hard-hat concept's central unit: an ESP32 talking Bluetooth.",
    width: 1600,
    height: 825,
  },
];

const BOOMBOX_DESIGN: CarouselSlide[] = [
  {
    src: `${MEDIA}/cds-fig-9.png`,
    alt: 'CDS drawing of the Boom-Box system: buzzer boxes wired to a plywood hub with an Arduino Mega 2560 and a laptop.',
    caption: 'The Boom-Box system, drawn end to end.',
    width: 1600,
    height: 1008,
  },
  {
    src: `${MEDIA}/cds-fig-10.png`,
    alt: 'CDS drawing of a Boom-Box unit: a navy MDF box with SKULE lettering, a T-handle, and a passive piezo buzzer.',
    caption: 'One Boom-Box unit: MDF painted navy, a T-handle, and a piezo buzzer.',
    width: 1600,
    height: 1152,
  },
  {
    src: `${MEDIA}/cds-fig-13.png`,
    alt: 'Dimensioned CDS drawing of the Boom-Box unit: an 80 mm T-handle over a 110 by 80 by 80 mm box with the SKULE logo.',
    caption: 'The Boom-Box unit, dimensioned.',
    width: 1431,
    height: 1600,
  },
];

const PAPERWORK: CarouselSlide[] = [
  {
    src: `${MEDIA}/cds-fig-12.png`,
    alt: 'The morphological chart from the CDS: functions and objectives as rows, means as columns, with colored concept paths drawn through the grid.',
    caption: 'The morph chart: every function crossed against every means.',
    width: 1600,
    height: 1302,
  },
  {
    src: `${MEDIA}/cds-fig-11.png`,
    alt: 'Gantt chart for March and April 2026 covering prototyping, testing, iteration, and final presentation preparation, with owners per task.',
    caption: 'The Gantt chart: prototyping, testing, and presentation prep planned to the day.',
    width: 1600,
    height: 668,
  },
];

const MODELING: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-1.jpg`,
    alt: 'A laptop with Blender open on the left, showing the eight modeled wands, and the CDS document open on the right with a hand-drawn diagram of the hub electronics.',
    caption: 'March 21: the model on one side of the screen, the report on the other.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/render-1.jpg`,
    alt: 'Blender render: a lineup of eight blue wands, each topped with a clear globe containing a different discipline symbol, including a lightning bolt, a flask, a gear, a pickaxe, an eight-ball, and a calculator.',
    caption: 'The eight disciplines, in a row.',
    width: 1600,
    height: 1027,
  },
  {
    src: `${MEDIA}/render-2.jpg`,
    alt: 'Blender render of the same eight wands seen from behind.',
    caption: 'The lineup from behind.',
    width: 1600,
    height: 1014,
  },
  {
    src: `${MEDIA}/render-4.jpg`,
    alt: 'Blender render of a single wand: a blue gripped handle with a clear globe on top, an Erlenmeyer flask sealed inside.',
    caption: 'A single wand, with the flask topper sealed in the globe.',
    width: 1600,
    height: 1024,
  },
  {
    src: `${MEDIA}/render-5.jpg`,
    alt: 'Blender render from a three-quarter angle showing the yellow LED puck seated under the globe mount.',
    caption: 'Under the globe, the LED puck that lights when a wand wins the round.',
    width: 1600,
    height: 976,
  },
  {
    src: `${MEDIA}/render-3.jpg`,
    alt: 'A darker Blender render of a single wand with the flask topper, seen close up.',
    caption: 'The globe, close up.',
    width: 1600,
    height: 986,
  },
  {
    src: `${MEDIA}/render-6.jpg`,
    alt: 'A Blender viewport view of a single wand against the working grid.',
    caption: 'In the viewport.',
    width: 1600,
    height: 1018,
  },
];

const BENCH: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-3.jpg`,
    alt: 'A laptop running the Arduino IDE with a serial monitor open, wired to an Arduino Uno and a red accelerometer breakout on a makerspace bench.',
    caption: 'Bringing up the sensor over I2C.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/bench-serial.mp4`,
    alt: 'Video: sensor readings streaming into the serial monitor while a hand moves the wired accelerometer over an Arduino.',
    caption: 'Watching the readings come in on the serial monitor.',
    width: 720,
    height: 1280,
    kind: 'video',
  },
  {
    src: `${MEDIA}/bench-home.mp4`,
    alt: 'Video: shaking the accelerometer breakout at a home desk until the LED on the breadboard lights.',
    caption: 'The same rig again at home, late at night.',
    width: 720,
    height: 1280,
    kind: 'video',
  },
  {
    src: `${MEDIA}/photo-20.jpg`,
    alt: 'The purple TCA9548A multiplexer breakout held between two fingers, with the breadboard and Arduino behind.',
    caption: 'The TCA9548A multiplexer, up close.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-12.jpg`,
    alt: 'Close-up of the breadboard at night: LEDs, resistors, and the purple multiplexer board wired to an Arduino Uno.',
    caption: 'LEDs and the multiplexer on the breadboard.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-19.jpg`,
    alt: 'The hub laid out on bubble wrap: breadboard with the multiplexer and two accelerometer breakouts, an LED, a buzzer, and the Arduino.',
    caption: 'The hub, laid out: multiplexer, sensors, LED, buzzer.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-15.jpg`,
    alt: 'A breadboard test with four accelerometer breakouts wired through the multiplexer to an Arduino, laptop behind.',
    caption: 'Four sensors through one multiplexer.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-13.jpg`,
    alt: 'Two wired wands beside a MacBook running the Arduino IDE with the two-wand firmware open.',
    caption: 'The two-wand rig beside the firmware.',
    width: 1200,
    height: 1600,
  },
];

const LEGWORK: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-21.jpg`,
    alt: 'The parts laid out on a workbench: an Arduino Uno, the purple multiplexer, LEDs and resistors, three red accelerometer breakouts, and a breadboard.',
    caption: 'The parts, laid out: one Arduino, one multiplexer, three sensors.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-2.jpg`,
    alt: 'A soldering station with helping hands holding a small purple multiplexer board mid-solder.',
    caption: 'Soldering the multiplexer breakout.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-18.jpg`,
    alt: 'An Arduino Uno R3 board resting on an open palm.',
    caption: 'The Arduino Uno that ran the hub.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-10.jpg`,
    alt: 'A makerspace worktable covered with wand handles, wiring, pliers, a drill, and a glue gun mid-build.',
    caption: "The team's bench at MyFab, mid-build.",
    width: 1600,
    height: 1200,
  },
];

const BUILD: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-5.jpg`,
    alt: 'Five 3D-printed blue wand handles with clear globes laid out on a table beside a breadboard hub wired to two of them.',
    caption: 'Five printed wands; the bottom two are wired into the hub.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-6.jpg`,
    alt: 'An assembled wand lying on a kitchen scale that reads 106 grams.',
    caption: '106 grams.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-7.jpg`,
    alt: 'A hand gripping a finished wand in front of the breadboard hub with the Arduino and multiplexer boards.',
    caption: 'Holding a finished wand, with the hub behind it.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-17.jpg`,
    alt: 'A teammate studying the two-wand rig on a desk with a multimeter, spare multiplexer boards, and a bag of jumper wires.',
    caption: 'Debugging with a multimeter and spare boards.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-14.jpg`,
    alt: 'The breadboard hub and Arduino packed on bubble wrap next to a USB cable and a bag of clip leads.',
    caption: 'Packed for transport between meetings.',
    width: 1200,
    height: 1600,
  },
];

const PRESENTING: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-8.jpg`,
    alt: "Five teammates in formal wear holding the wands and electronics in front of a University of Toronto Engineering 'Defy Gravity' backdrop.",
    caption: 'Presentation day.',
    width: 1199,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-11.jpg`,
    alt: 'Henry in a suit holding two finished wands and the hub electronics, beside the Myhal Centre plaque.',
    caption: 'Before the final presentation.',
    width: 1200,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-9.jpg`,
    alt: 'The team giving thumbs up beside the client after the final presentation, with a laptop showing the team slide and wands on the table.',
    caption: 'With our client, after the final presentation.',
    width: 1600,
    height: 1200,
  },
];

export function GyroscopeWand() {
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="The Gyroscope Wand" subtitle="APS112 Engineering Strategies & Practice II — Winter 2026" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              Team 013 —{' '}
              {TEAM.map((m) => (
                <span key={m.name}>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                  {', '}
                </span>
              ))}
              and{' '}
              <a href="https://www.linkedin.com/in/henry-kim-uoft/" target="_blank" rel="noopener noreferrer">
                Henry Kim
              </a>{' '}
              (me)
            </p>
            <p>
              Client:{' '}
              <a
                href="https://www.linkedin.com/in/alexandre-j-w-klaus/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Alexandre Klaus
              </a>
              ,{' '}
              <a
                href="https://www.instagram.com/skuletm_kup/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Skule™ Kup
              </a>{' '}
              director
            </p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>
              Skule™ Kup is a year-long competition between U of T's engineering disciplines. One
              of its games is Discipline Feud, where teams race to guess the most common answers
              to survey questions, and whoever signals first gets to answer. The signalling is the
              problem. When several people react at once, the organizers have to judge who was
              first, the judgment gets disputed, and the game slows down. Our team of six spent
              the winter semester designing a fix.
            </p>
            <br />
            <p>
              Here is the whole project the way we presented it: the final deck from April 9th,
              2026. Turn through it below, or open it in its own tab. The rest of this page is the
              story behind it.
            </p>
            <br />
            <PdfDeck
              src={`${MEDIA}/deck.pdf`}
              title="Buzzer Beaters, the final presentation"
              captions={DECK_NOTES}
            />
            <p className="story-head">A real client</p>
            <p>
              APS112 gives first-year teams a real client, and ours was Alexandre Klaus, a
              second-year Engineering Science student and the current Skule™ Kup director. His
              brief was specific: detect the first responder reliably, handle a changing number of
              contestants in real time, and keep the system safe and portable. The requirements
              came from visiting the rooms themselves. We measured the EngSoc Arena at 46 decibels
              of ambient sound and noted its lighting controls and table heights, so the design
              would fit the room it will be used in.
            </p>
            <br />
            <p className="story-head">Three ideas on a whiteboard</p>
            <p>
              My formal role was quality assurance, but the contribution I care most about
              happened at a whiteboard. Earlier in the term, my first peer evaluation told me
              plainly that I should be more present in team discussions. I took that seriously.
              During idea selection, I came to one of our in-person meetings prepared and
              presented three design directions on the whiteboard: a hard-hat concept with
              built-in buzzers, a gyroscope-based wand, and a conventional buzzer system. For each
              one I walked through the detection method, the physical layout, and how it would be
              used on game day. After several rounds of deliberation the team chose the wand, and
              the client responded well to the less conventional ideas.
            </p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/photo-22.jpg`}
                alt="The whiteboard from that meeting: three numbered options — a hard hat with sensor choices listed, a gyroscope light stick with two SKULE wands wired to a hub box and a computer, and a general buzzer system — with notes on collecting all data in one place and lighting up the first responder."
                width={1600}
                height={1200}
                loading="lazy"
              />
              <figcaption>The whiteboard itself: hard-hat, gyroscope light stick, general buzzer.</figcaption>
            </figure>
            <p>
              The idea is simple to say: instead of pressing a button, you raise the wand. Motion
              detection identifies the first wand to move, and each discipline gets its own topper
              sealed in a clear globe, so every wand shows its discipline's symbol.
            </p>
            <br />
            <p>
              In the report, the three directions became formal designs. The team had generated 72
              ideas, consolidated them to 38, voted them down to 10, and kept three. The CDS drew
              each one out properly, and the figures below are from those pages.
            </p>
            <br />
            <p>
              Alternative Design 1 was the Skule™ Wand: a handheld device that reads a response as
              angular velocity, with an inertial measurement unit in every wand and an I²C
              multiplexer collecting all eight signals into one Arduino.
            </p>
            <br />
            <FigureCarousel slides={WAND_DESIGN} label="Alternative Design 1: the Skule Wand" />
            <p>
              Alternative Design 2 was the Hard-Hat Smack: eight hard hats, each with a
              force-sensitive pod on the crown that you slap, reporting over Bluetooth to an ESP32.
              Viscoelastic foam inside the hat protects the head that does the slapping.
            </p>
            <br />
            <FigureCarousel slides={HARDHAT_DESIGN} label="Alternative Design 2: the Hard-Hat Smack" />
            <p>
              Alternative Design 3 was the Boom-Box: the classic buzzer rebuilt around a T-handle,
              with a piezo buzzer in every box and an Arduino Mega in the hub.
            </p>
            <br />
            <FigureCarousel slides={BOOMBOX_DESIGN} label="Alternative Design 3: the Boom-Box" />
            <p>
              The Pugh method decided it. With the wand as the datum, the Hard-Hat Smack scored
              minus three and the Boom-Box minus one, mostly on weight and size, and the Skule™
              Wand became the proposed design.
            </p>
            <br />
            <p className="story-head">Modeling it</p>
            <p>
              To make the concept concrete I built a prototype model in Blender, finishing it the
              day before the CDS deadline. The model works out the full assembly: a gripped
              handle, a globe mount, an LED puck that lights when a wand wins the round, and the
              globe with a discipline topper inside. I modeled eight toppers, one per discipline.
            </p>
            <br />
            <FigureCarousel slides={MODELING} label="Blender model and renders" />
            <p>
              The model below is the Blender file itself, converted for the web. Drag to orbit,
              scroll to zoom.
            </p>
            <br />
            <ModelViewer
              src={`${MEDIA}/wand.glb`}
              poster={{
                src: `${MEDIA}/render-1.jpg`,
                alt: 'Poster for the interactive 3D model: the lineup of eight wands.',
                width: 1600,
                height: 1027,
              }}
              caption="All eight wands, in 3D — modeled in Blender™."
            />
            <p className="story-head">Making it move</p>
            <p>
              I also wrote the firmware for a two-wand bench prototype. It runs on an Arduino with
              a TCA9548A I2C multiplexer and a motion sensor in each wand. The loop samples both
              sensors, derives speed and acceleration magnitudes from the readings, and compares
              them against a threshold. The first wand past the threshold locks the round, lights
              its own LED, and plays its own tone on the hub's buzzer, so everyone can hear which
              wand was first. The code self-checks too: it scans the I2C bus, verifies each
              sensor's identity register, and runs the sensor's self-test before trusting it. A
              note on the name: we pitched the concept with a gyroscope, and the bench prototype
              detects motion with accelerometers.
            </p>
            <br />
            <FigureCarousel slides={BENCH} label="Firmware bench work" />
            <p>
              Getting there took legwork outside the code. I visited MyFab to understand what we
              could actually manufacture, asked upper-year students for advice, and at one meeting
              brought in a physical gyroscope so the team could handle the thing we kept talking
              about.
            </p>
            <br />
            <FigureCarousel slides={LEGWORK} label="MyFab and hardware legwork" />
            <p className="story-head">From model to hardware</p>
            <p>
              After the model, we built it. We printed five handles, capped them with clear
              globes, and wired two of them up as live wands into a breadboard hub carrying the
              Arduino, the multiplexer, the LEDs, and the buzzer. One assembled wand weighs 106
              grams on a kitchen scale; the CDS had calculated 102. The number mattered, because
              portability was in the client's brief from the first meeting.
            </p>
            <br />
            <FigureCarousel slides={BUILD} label="Building the wands" />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/demo-shake.mp4`}
                controls
                playsInline
                preload="metadata"
                width={720}
                height={1280}
                aria-label="Bench demo: shaking the wand lights the globe"
              />
              <figcaption>Shake the wand, and the globe lights.</figcaption>
            </figure>
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/demo-two-wands.mp4`}
                controls
                playsInline
                preload="metadata"
                width={720}
                height={1280}
                aria-label="Bench demo: two wands racing; the first to move wins the round"
              />
              <figcaption>Both wands wired up: the first one to move wins the round.</figcaption>
            </figure>
            <p className="story-head">The paper trail</p>
            <p>
              Alongside the hardware, the course asked for formal documents, and the writing took
              as much work as the build. The Project Requirements came first, in early March. The
              Conceptual Design Specification followed three weeks later: 95 pages of problem
              framing, morph charts, alternative designs, and measures of success. The night
              before the CDS was due we were 700 words over the limit at 2 a.m., and the whole
              team stayed on call until seven in the morning cutting words and fixing formatting.
              As quality assurance manager I did the final proofreading and kept our submissions
              on time. Everything below opens right here on the page.
            </p>
            <br />
            <FigureCarousel slides={PAPERWORK} label="Morph chart and schedule from the CDS" />
            <DocShelf docs={DOCS} base={MEDIA} />
            <p className="doc-note">
              Student numbers and personal contact details are redacted from the published copies.
            </p>
            <p className="story-head">The feedback loop</p>
            <p>
              This course taught me to treat peer feedback the way I treat a bug report. The first
              evaluation said I needed to engage more; I answered it with the whiteboard session
              and the prototype, and I later wrote the whole loop up in the Team Feedback Analysis
              above. By the second evaluation, teammates were writing about the late nights on the
              CDS and the resources I kept bringing to meetings. The feedback also gave me new
              things to work on, like sharing more during discussions and responding faster
              online. I would rather know these things in first year than discover them at a job.
            </p>
            <br />
            <p>
              Kamilia wrote afterward that working on this team was one of the highlights of her
              first year. It was one of mine too.
            </p>
            <br />
            <FigureCarousel slides={PRESENTING} label="Presentation day" />
            <p>
              We hope to build the production version with Alexandre and see the wand make its
              debut at a future Skule™ Kup event.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
