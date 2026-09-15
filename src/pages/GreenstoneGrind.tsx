import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { useLang } from '../i18n';
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
  const { t } = useLang();
  const tr = (slides: CarouselSlide[]) => slides.map((sl) => ({ ...sl, alt: t(sl.alt), caption: t(sl.caption) }));
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
            <p>{t("Before this trip I thought mining was mostly about heavy machinery. It turned out to be about systems: the layers of safety, redundancy, and human judgement that let those machines run responsibly at that scale. For one week in February, through the Greenstone Grind, a partnership between the Ontario Mining Association and Equinox Gold's Greenstone Gold Mines, eleven of us from U of T Engineering rotated through the departments of an operating gold mine in Northwestern Ontario.")}</p>
            <br />
            <p className="story-head">Getting in</p>
            <p>{t("I applied because I wanted to understand mining past the usual misconceptions, including my own. In the application I wrote about the MacBook I was typing on: its circuits run on copper, gold, and lithium, and every one of those metals came out of the ground through someone's hands. Almost everything around us starts that way, and most of us know almost nothing about it.")}</p>
            <br />
            <p>{t("The program was built for that gap: a Reading Week at Ontario's newest gold mine, open to first-year undeclared engineering students, with travel, meals, and lodging covered, and only eight to twelve spots. More than seventy-five students applied and eleven were chosen, so when the email arrived saying \"Congrats! You're invited to the Greenstone Grind Experience,\" I was excited. In the application I had written that I wanted the week to turn \"pre-experience curiosity into post-experience conviction.\" Getting into a working mine felt unreal at first.")}</p>
            <br />
            <Figure
              src={`${MEDIA}/photo-1.jpg`}
              alt={t("Email from the Ontario Mining Association: 'You're invited to the Greenstone Grind Experience!' confirming participation on February 16 to 20, 2026 at Equinox Gold's Greenstone Mine in Geraldton, Ontario.")}
              caption={t("The email that started it.")}
              width={797}
              height={1600}
            />
            <FigureCarousel slides={tr(JOURNEY)} label={t("Getting credentialed and heading north")} />
            <p className="story-head">North</p>
            <p>{t("Geraldton is a long way north of Toronto, and the route runs through Thunder Bay. We each had a full kit: hard hat, steel-toe boots, hi-vis layers, winter gloves. Before we were allowed anywhere near operations we completed safety training, did a lock-out demonstration, and earned industry credentials through NORCAT. The training list ran from WHMIS to fall protection and confined-space awareness. Safety is built into every process there. The environment is hazardous by nature, so every procedure exists to reduce that risk.")}</p>
            <br />
            <FigureCarousel slides={tr(ARRIVAL)} label={t("Arriving on site: the bus, the kit, the gear")} />
            <p className="story-head">The scale of it</p>
            <p>{t("The open pit is already about 240 metres deep. Haul trucks carry up to 250 tonnes on tyres over ten feet tall. I rode along with a haul truck operator for part of a shift and learned about stockpiles, dump locations, the navigation systems, automated loading and unloading, and the braking redundancies built in for a failure. The trucks have huge blind spots, covered by camera systems and procedural controls, and their operators work 12-hour shifts on 14-day rotations to keep the mine running 24/7. That is a lot of responsibility to carry.")}</p>
            <br />
            <p>{t("I also sat inside a shovel, a machine even larger than the haul trucks that lifts around 70 tonnes in a single bucket, and learned about remote dozer operation, where equipment in hazardous zones is driven from a safe spot. We went through blasting too: how small parts like detonators and boosters, with automation on top, break the rock in a controlled way. Paul Dawe and the mining operations team showed me how much of managing that risk is experience and situational awareness sitting on top of all those systems.")}</p>
            <br />
            <FigureCarousel slides={tr(PIT)} label={t("The open pit: shovels, haul trucks, and dozers")} />
            <p className="story-head">Inside the mill</p>
            <p>{t("The mill is where rock becomes gold, and it was one of the parts of the trip I enjoyed most. We walked the whole process: crushing, ball mills, high-pressure grinding rolls, flotation, gravity concentration, leaching, cyanidation, carbon stripping, electrowinning, the furnace, and tailings handling. Chemical, mechanical, and electrical systems all run together there, at a scale I had only read about.")}</p>
            <br />
            <FigureCarousel slides={tr(MILL)} label={t("Inside the mill: the process plant end to end")} />
            <p>{t("During our rotation a conveyor belt problem shut down the crushers, and gold production carried on anyway, because the mill keeps a stockpile of crushed material from previous days. The design assumes something will fail and buys hours of production when it does.")}</p>
            <br />
            <p>{t("The mine generates its own power with natural gas generators. In the generator room we saw variable-frequency drives holding the AC frequency steady, one place where electrical engineering keeps the whole operation stable.")}</p>
            <br />
            <p>{t("A small detail I liked: the activated carbon in the CIP tanks is made from dried coconut shells, so something as far away as coconut production can indirectly affect gold output.")}</p>
            <br />
            <p>{t("Much of this came from Freddie (Frederique Belanger) and Eric, who explained the reasoning along with the process flow: why the redundancy is there, how the control systems decide, and how the chemistry gets decided under real operating constraints. Equations I have learned, and some I have not yet, were running continuously in front of us, and none of it felt theoretical.")}</p>
            <br />
            <p className="story-head">Beneath the surface</p>
            <p>{t("In geology we handled real rock samples and learned how deposits are found by following quartz veins through folds, faults, and changes in rock type. The mine sits on an Archean greenstone belt, formed billions of years ago when magma flowed at the Earth's surface, and it felt more real than anything in a textbook. In engineering and planning I saw how modelling, blast simulations, surveying, drone mapping, and geotechnical analysis feed the daily decisions, and meeting Nick Pantis, a mining engineer in training, made that career path feel reachable.")}</p>
            <br />
            <p>{t("Maintenance and reliability engineering was the rotation I liked most. With Fabricio Crego I saw how vehicles come in for planned maintenance after a set number of operating hours, and how oil samples are analyzed, like blood tests, to catch internal wear before it becomes a failure. The engineers there use the data from repeated failures to trace root causes and design long-term solutions rather than quick fixes. In the shop I saw loaders and haul trucks up close, and among them couplings and components I once drew in Grade 12 mechanical drawing, now at full industrial scale.")}</p>
            <br />
            <Figure
              src={`${MEDIA}/shop-793.jpg`}
              alt={t("A CAT 793 haul truck raised inside the maintenance shop with hi-vis workers servicing it beneath an overhead crane.")}
              caption={t("A CAT 793 in the maintenance shop.")}
              width={1200}
              height={1600}
            />
            <p className="story-head">What stays with me</p>
            <p>{t("The tailings management facility is where mine closure gets planned for. Detoxified slurry is managed, water is reclaimed and reused, and the land is engineered to return to a vegetated, natural state after the mine's life, which changed how I think about sustainability in mining. The Emergency Response Team left a similar mark: wearing the gear and feeling its weight, and the physical limits the responders work under, made me appreciate the people who train to protect everyone else on site.")}</p>
            <br />
            <FigureCarousel slides={tr(STAYS)} label={t("Tailings, closure, and the emergency-response team")} />
            <p>{t("In the evenings we were simply eleven students in the north. We cheered on Team Canada at the Winter Olympics alongside the mine workers, and it was strange to cheer for a gold medal in the company of people who mine the metal.")}</p>
            <br />
            <FigureCarousel slides={tr(GROUP)} label={t("The eleven of us")} />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/reel.mp4`}
                controls
                playsInline
                preload="metadata"
                width={1080}
                height={1920}
                aria-label={t('The official Greenstone Grind film of the week')}
              />
              <figcaption>{t("The official film of the week, made by the program.")}</figcaption>
            </figure>
            <p>{t("Everyone I met took the time to explain their work and then to talk about their careers, their lives, and what working in mining is like. Those conversations are a large part of why I now think this is a field I would enjoy being part of. I am especially grateful to Roger Souckey and Dina Quenneville for being with us throughout the week on site, and to Paula Daidone for supporting us every step of the way, from Toronto to Greenstone and back.")}</p>
            <br />
            <p>{t("Mining turned out to be interdisciplinary in a way I did not expect: geology, chemistry, mechanics, electricity, software, logistics, and people, with engineering holding it all together. The industry is still changing, and demand for the minerals it produces will grow with the energy transition, electric vehicles, and batteries. I hope to return to the mine one day.")}</p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
