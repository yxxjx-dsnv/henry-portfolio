import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';

const MEDIA = '/media/greenstone-grind';

type FigureProps = { src: string; alt: string; caption: string; width: number; height: number };

function Figure({ src, alt, caption, width, height }: FigureProps) {
  return (
    <figure className="story-figure">
      <img src={src} alt={alt} width={width} height={height} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const P = { width: 1200, height: 1600 };
const V = { width: 720, height: 1280, kind: 'video' as const };

const JOURNEY: CarouselSlide[] = [
  { src: `${MEDIA}/maps.jpg`, alt: 'A phone map of the 3-hour drive from Thunder Bay to the inn near the mine.', caption: 'The last leg: Thunder Bay to the mine, three hours north.', width: 738, height: 1600 },
  { src: `${MEDIA}/training.jpg`, alt: "A laptop showing the mine's online site-orientation training modules, including a plant-site aerial map.", caption: 'The online orientation, before we set foot on site.', ...P },
  { src: `${MEDIA}/badge.jpg`, alt: 'A NORCAT visitor badge on an Equinox Gold Greenstone Mine lanyard (the ID number and codes redacted).', caption: 'Credentialed in: the visitor badge that let us on site.', ...P },
];

const ARRIVAL: CarouselSlide[] = [
  { src: `${MEDIA}/bus.jpg`, alt: "The white Equinox Gold Greenstone Mine crew coach under a clear blue sky, a 'We're Hiring!' sticker on its side.", caption: "The mine's crew bus.", ...P },
  { src: `${MEDIA}/bus-night.jpg`, alt: 'The dark interior of the crew bus at night, lit red and blue, students in orange hi-vis facing the road ahead.', caption: 'Pre-dawn ride to site.', ...P },
  { src: `${MEDIA}/to-bus.jpg`, alt: 'The hi-vis-clad group filing across a metal grate toward a yellow bus in a snowy night lot.', caption: 'Filing out to the bus in the dark.', ...P },
  { src: `${MEDIA}/kit.jpg`, alt: 'PPE kit on a hotel bed: an orange hi-vis jacket and shirts, a yellow hard hat with ear protection, boots, gloves, and an Equinox Gold backpack.', caption: 'The kit, laid out the night before the first rotation.', ...P },
  { src: `${MEDIA}/selfie-parka.jpg`, alt: 'A student in the full orange hi-vis parka and yellow hard hat with ear muffs.', caption: 'Kitted out.', ...P },
  { src: `${MEDIA}/selfie-hat.jpg`, alt: 'A student in a yellow hard hat with ear muffs and safety glasses.', caption: 'Hard hat, ear muffs, safety glasses.', ...P },
];

const PIT: CarouselSlide[] = [
  { src: `${MEDIA}/pit-load.jpg`, alt: 'A Komatsu PC5500 electric mining shovel loading a CAT haul truck against a benched rock highwall under blue sky.', caption: 'The shovel loading a haul truck at the face.', width: 1201, height: 1600 },
  { src: `${MEDIA}/vid-shovel-cab.mp4`, alt: 'Video from inside a shovel cab, looking through the window grate as the bucket digs, a CAT monitor to the side.', caption: 'Inside the shovel cab as it digs.', ...V },
  { src: `${MEDIA}/pit-shovel-side.jpg`, alt: 'A clean side profile of a yellow Komatsu PC5500 hydraulic shovel, bucket and boom against a rock face and deep blue sky.', caption: 'The PC5500 shovel, side on.', ...P },
  { src: `${MEDIA}/pit-shovel-low.jpg`, alt: "A low-angle view of the shovel's tracks and boom with a white field-service truck parked beneath it.", caption: 'For scale: a service truck under the shovel.', ...P },
  { src: `${MEDIA}/pit-shovel-muck.jpg`, alt: 'A CAT hydraulic shovel parked against a fractured rock face amid blasted muck.', caption: 'A shovel in the blasted muck.', ...P },
  { src: `${MEDIA}/pit-cab.jpg`, alt: 'First-person view from inside a shovel cab over the snowy pit floor, control monitors in frame.', caption: 'The operator\'s view.', ...P },
  { src: `${MEDIA}/ride-dawn.jpg`, alt: 'View from inside a haul-truck cab across the snowy pit at pink dawn, dashboard telemetry glowing and another truck\'s headlights ahead.', caption: 'The ride-along, from the cab of haul truck 312 at dawn.', ...P },
  { src: `${MEDIA}/vid-pit-sun.mp4`, alt: 'Video of a sun-star over the open pit with a CAT 793 haul truck, shot from a truck window.', caption: 'The pit under a low winter sun.', ...V },
  { src: `${MEDIA}/tyre.jpg`, alt: 'Three students in orange hi-vis and hard hats giving thumbs up in front of a towering haul-truck tyre and wheel.', caption: 'Beside a haul-truck tyre, for scale.', ...P },
  { src: `${MEDIA}/dozer-side.jpg`, alt: 'Side profile of a CAT D11 tracked dozer marked DZ481, its ripper and undercarriage against a benched pit wall.', caption: 'DZ481, a CAT D11 dozer.', ...P },
  { src: `${MEDIA}/dozer-front.jpg`, alt: 'Three-quarter front view of the DZ481 CAT D11 dozer showing its full-width blade and tracks on the pit floor.', caption: 'The same dozer, head on.', ...P },
  { src: `${MEDIA}/dozer-shovel.jpg`, alt: 'A tracked CAT dozer on the snow-dusted pit floor while a shovel loads a haul truck against the highwall behind it.', caption: 'Dozer in front, shovel loading behind.', ...P },
  { src: `${MEDIA}/pit-wall.jpg`, alt: 'A tall benched rock face of the open pit under a clear blue sky, showing the layered bench-and-berm wall.', caption: 'The pit wall, bench by bench.', ...P },
  { src: `${MEDIA}/site-overview.jpg`, alt: 'An elevated winter overview of the mine site: the domed coarse-ore stockpile, a haul truck, camp trailers and rows of pickups.', caption: 'The site from above, stockpile and camp.', ...P },
  { src: `${MEDIA}/gimbal.jpg`, alt: 'A Sony mirrorless camera on a red gimbal filming a shovel loading, held by a gloved hi-vis operator inside a vehicle.', caption: 'Filming the pit on a gimbal from the truck.', ...P },
  { src: `${MEDIA}/vid-filming.mp4`, alt: 'Video of the camera-on-gimbal setup filming a haul truck through a vehicle window.', caption: 'The making-of, from the same seat.', ...V },
];

const MILL: CarouselSlide[] = [
  { src: `${MEDIA}/mill-circuit.jpg`, alt: 'Inside the grinding circuit: large ball and SAG mills and flotation cells across multi-level steel galleries under high-bay lighting.', caption: 'The grinding circuit.', ...P },
  { src: `${MEDIA}/control-room.jpg`, alt: 'The mill control room: an operator at a desk of seven monitors of plant process schematics, an overhead screen with a live camera feed of the mill.', caption: 'The mill control room.', ...P },
  { src: `${MEDIA}/mill-liners.jpg`, alt: 'A rack of numbered steel mill-liner segments and round collets arranged in the shop.', caption: 'Spare mill liners, numbered and racked.', ...P },
  { src: `${MEDIA}/catwalk.jpg`, alt: 'A worker in hi-vis walks away along a steel grating catwalk through the process-plant structure.', caption: 'Through the plant on the catwalks.', ...P },
  { src: `${MEDIA}/engine-bay.jpg`, alt: 'The cramped engine bay of a large machine, twin diesel powerpacks with yellow exhaust manifolds and piping.', caption: 'Inside a powerpack bay.', ...P },
  { src: `${MEDIA}/switchgear.jpg`, alt: 'A long row of grey electrical motor-control-centre cabinets with coloured push-buttons and breaker handles.', caption: 'The motor-control-centre line.', ...P },
  { src: `${MEDIA}/abb-panel.jpg`, alt: 'The open interior of an ABB electrical control panel: dense wiring, terminal blocks, PLC modules, breakers and red transformers.', caption: 'Behind a control panel door.', ...P },
  { src: `${MEDIA}/thickener.jpg`, alt: 'A steaming circular thickener tank of process water over a yellow guardrail, storage tanks behind.', caption: 'A thickener, where water is reclaimed.', ...P },
  { src: `${MEDIA}/mill-sunset.jpg`, alt: 'The mill and process-plant complex with conveyors silhouetted against an orange sunset over snow.', caption: 'The mill at sunset.', ...P },
  { src: `${MEDIA}/mill-aerial.jpg`, alt: 'An elevated view of the dark blue mill and conveyor complex with a steaming circular thickener in front.', caption: 'The mill complex from above.', ...P },
];

const STAYS: CarouselSlide[] = [
  { src: `${MEDIA}/ert-gear.jpg`, alt: 'Rows of orange mine-rescue turnout gear hanging on overhead racks above lined-up boots in the drying room.', caption: 'The mine-rescue team\'s gear, racked and ready.', ...P },
  { src: `${MEDIA}/truck-tailings.jpg`, alt: 'View from the back seat of the mine crew truck: a hi-vis driver up front and a tailings-management handout on the seat.', caption: 'On the road to the tailings facility.', ...P },
];

const GROUP: CarouselSlide[] = [
  { src: `${MEDIA}/group.jpg`, alt: 'The eleven students posing together in a log cabin, all in matching green Greenstone Grind "This Is Mine Life" long-sleeve shirts.', caption: 'The eleven of us. This Is Mine Life.', width: 1600, height: 1200 },
  { src: `${MEDIA}/vid-group.mp4`, alt: 'Video of the eleven students in their green shirts gathered in the cabin, waving.', caption: 'The group, the same night.', ...V },
];

export function GreenstoneGrind() {
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/extra-curricular" className="story-back">
        &larr; All activities
      </Link>
      <Hero title="The Greenstone Grind" subtitle="a week inside a gold mine — February 16–20, 2026" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>One of 11 students selected from 75+ applicants across U of T Engineering</p>
            <p>
              <a href="https://greenstonegoldmines.com" target="_blank" rel="noopener noreferrer">
                Greenstone Mine
              </a>{' '}
              (Equinox Gold), Geraldton, Ontario · a program of the{' '}
              <a href="https://oma.on.ca" target="_blank" rel="noopener noreferrer">
                Ontario Mining Association
              </a>
            </p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>
              Before this trip, I thought mining was primarily about heavy machinery. What I
              learned instead is that it is about systems: layers of safety, redundancy, and human
              decision-making that allow those machines to operate responsibly at scale. For one
              week in February, through the Greenstone Grind, a partnership between the Ontario
              Mining Association and Equinox Gold's Greenstone Gold Mines, eleven of us from U of
              T Engineering spent the week at an operating gold mine in Northwestern Ontario,
              rotating through the departments that keep it running.
            </p>
            <br />
            <p className="story-head">Getting in</p>
            <p>
              I applied because I wanted to understand the mining industry beyond the common
              misconceptions, mine included. In the application I wrote about the MacBook I was
              typing on: its circuits run on copper, gold, and lithium, and every one of those
              metals came out of the ground through someone's hands. Almost everything around us
              starts that way. Mining sits underneath the whole of modern technology, and most of
              us, me included, know almost nothing about it.
            </p>
            <br />
            <p>
              The program was built for exactly that gap: a Reading Week at Ontario's newest gold
              mine, open to first-year undeclared engineering students, with travel, meals, and
              lodging covered, and only eight to twelve spots. More than seventy-five students
              applied and eleven were chosen, so when the email arrived saying "Congrats! You're
              invited to the Greenstone Grind Experience," I was genuinely excited. In the
              application I had written that I wanted the week to turn "pre-experience curiosity
              into post-experience conviction." Having the opportunity to access an active mine
              and see operations firsthand felt unreal at first.
            </p>
            <br />
            <Figure
              src={`${MEDIA}/photo-1.jpg`}
              alt="Email from the Ontario Mining Association: 'You're invited to the Greenstone Grind Experience!' confirming participation on February 16–20, 2026 at Equinox Gold's Greenstone Mine in Geraldton, Ontario."
              caption="The email that started it."
              width={797}
              height={1600}
            />
            <FigureCarousel slides={JOURNEY} label="Getting credentialed and heading north" />
            <p className="story-head">North</p>
            <p>
              Geraldton is a long way north of Toronto, and the route runs through Thunder Bay.
              We each had a full kit: hard hat, steel-toe boots, hi-vis layers, winter gloves.
              Before we were allowed anywhere near operations, we completed safety training,
              performed a lock-out demonstration, and earned industry credentials through NORCAT.
              The program's training list ran from WHMIS to fall-protection and confined-space
              awareness. What stood out to me was how deeply safety is embedded into every
              process: the environment is inherently hazardous, and every procedure is built
              around reducing that risk.
            </p>
            <br />
            <FigureCarousel slides={ARRIVAL} label="Arriving on site: the bus, the kit, the gear" />
            <p className="story-head">The scale of it</p>
            <p>
              Then came the scale. The open pit is already about 240 metres deep. Haul trucks
              carry up to 250 tonnes on tyres over ten feet tall. Seeing this in person completely
              changed how I understand infrastructure. I rode along with a haul truck operator
              during part of a shift and learned about stockpiles, dump locations, the navigation
              systems, automated loading and unloading, and the multiple braking redundancies
              built in case of failure. These trucks have massive blind spots, mitigated through
              camera systems and procedural controls, and their operators work 12-hour shifts over
              14-day rotations to keep the mine running safely 24/7. What impressed me most was
              how much responsibility they carry.
            </p>
            <br />
            <p>
              I also had the chance to sit inside a shovel, a machine even larger than the haul
              trucks, capable of lifting around 70 tonnes in a single bucket, and learned about
              remote dozer operations, where equipment in hazardous zones is controlled from a
              safe location. We explored the blasting process too, and how small components like
              detonators and boosters, combined with automation, enable controlled rock
              fragmentation. Spending time with Paul Dawe and the mining operations team showed me
              how experience, systems, and situational awareness come together to manage risk in
              real time.
            </p>
            <br />
            <FigureCarousel slides={PIT} label="The open pit: shovels, haul trucks, and dozers" />
            <p className="story-head">Inside the mill</p>
            <p>
              The mill is where rock becomes gold, and it was one of the most exciting parts of
              the trip for me. We walked through the entire
              process: crushing, ball mills, high-pressure grinding rolls, flotation, gravity
              concentration, leaching, cyanidation, carbon stripping, electrowinning, the furnace,
              and tailings handling. Seeing chemical, mechanical, and electrical systems operate
              together at this scale made concepts I have studied click into place.
            </p>
            <br />
            <FigureCarousel slides={MILL} label="Inside the mill: the process plant end to end" />
            <p>
              One thing that stood out was how resilient the system is. During our rotation, a
              conveyor belt problem shut down the crushers, yet gold production continued, because
              the mill had stored crushed material from previous days. This kind of systems
              thinking prevents hours of lost production and shows how engineering design
              anticipates failure.
            </p>
            <br />
            <p>
              The mine also generates its own power with natural gas generators. Walking through
              the generator room and seeing variable-frequency drives controlling AC frequencies
              reinforced how critical electrical engineering is to keeping operations stable.
            </p>
            <br />
            <p>
              Even small details were fascinating: the activated carbon in the CIP tanks comes
              from dried coconut shells, which means something as distant as coconut production
              can indirectly affect gold output.
            </p>
            <br />
            <p>
              A huge part of this learning came from Freddie (Frederique Belanger) and Eric, who
              walked us through not just the process flow but the reasoning behind it: why the
              redundancy exists, how the control systems decide, and how chemical decisions are
              made under real operating constraints. Watching equations I have learned, and some I
              have yet to learn, applied continuously in real time was incredibly motivating. None
              of it felt theoretical.
            </p>
            <br />
            <p className="story-head">Beneath the surface</p>
            <p>
              The later rotations helped me understand how everything connects underneath. In
              geology, we examined real rock samples and learned how deposits are identified by
              following quartz veins through folds, faults, and different rock types. The mine's
              Archean-age greenstone belt, formed billions of years ago when magma flowed at the
              Earth's surface, felt more real than anything I had encountered in textbooks. In
              engineering and planning, I saw how modelling, blast simulations, surveying, drone
              mapping, and geotechnical analysis support daily decision-making, and meeting Nick
              Pantis, a mining engineer in training, made that career path feel tangible and
              achievable.
            </p>
            <br />
            <p>
              Mine maintenance and reliability engineering stood out to me the most. Learning from
              Fabricio Crego, I saw how vehicles are brought in for planned maintenance after set
              operating hours, and how oil samples are analyzed, similar to blood tests, to detect
              signs of internal wear before they become failures. What fascinated me was how
              engineers use data from repeated failures to trace root causes and design long-term
              solutions, not just quick fixes. Walking through the shop was incredibly exciting:
              loaders and haul trucks up close, and among them couplings and components I once
              drew in Grade 12 mechanical drawing, now operating at full industrial scale.
            </p>
            <br />
            <Figure
              src={`${MEDIA}/shop-793.jpg`}
              alt="A CAT 793 haul truck raised inside the maintenance shop with hi-vis workers servicing it beneath an overhead crane."
              caption="A CAT 793 in the maintenance shop."
              width={1200}
              height={1600}
            />
            <p className="story-head">What stays with me</p>
            <p>
              The tailings management facility showed me the scale and responsibility involved in
              mine closure planning. Detoxified slurry is managed, water is reclaimed and reused,
              and the land is engineered for full reclamation after the mine's life. Understanding
              that this land is designed to eventually return to a natural, vegetated state
              shifted how I think about sustainability in mining. Spending time with the Emergency
              Response Team made a similar impression: experiencing the weight of the gear and the
              physical constraints responders work under gave me a new appreciation for the people
              who train to protect others across the site.
            </p>
            <br />
            <FigureCarousel slides={STAYS} label="Tailings, closure, and the emergency-response team" />
            <p>
              In the evenings we were simply eleven students in the north. We cheered on Team
              Canada at the Winter Olympics alongside the mine workers, and it was strange to
              cheer for a gold medal in the company of people who mine the metal.
            </p>
            <br />
            <FigureCarousel slides={GROUP} label="The eleven of us" />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/reel.mp4`}
                controls
                playsInline
                preload="metadata"
                width={1080}
                height={1920}
                aria-label="The official Greenstone Grind film of the week"
              />
              <figcaption>The official film of the week, made by the program.</figcaption>
            </figure>
            <p>
              Each person I met took the time not only to explain their processes, but to talk
              about their careers, lifestyles, and experiences working in mining. Those
              conversations played a huge role in helping me realize that this is a field I would
              genuinely enjoy practicing and being a part of. I am especially grateful to Roger
              Souckey and Dina Quenneville for being with us throughout the experience on site,
              and to Paula Daidone for supporting us every step of the way, from Toronto to
              Greenstone and back.
            </p>
            <br />
            <p>
              Mining turned out to be deeply interdisciplinary: geology,
              chemistry, mechanics, electricity, software, logistics, and people, with engineering
              at the crux of making it all safe, efficient, and responsible. The industry is still
              developing, and the demand for the minerals it produces will only grow with the
              energy transition, electric vehicles, and batteries. That is exactly what makes it
              interesting, and I hope to return to the mine in the future.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
