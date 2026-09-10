import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';
import { DocShelf, type ShelfDoc } from '../components/DocShelf';
import { PdfFlow } from '../components/PdfFlow';
import { BridgeStudio } from '../components/BridgeStudio';

const MEDIA = '/media/civ102-bridge';

const DOCS: ShelfDoc[] = [
  { title: 'Design Calculations', meta: 'hand calculations · 19 pages', file: 'design-calculations.pdf', kind: 'pdf' },
  { title: 'Engineering Assembly', meta: 'drawings · 11 pages', file: 'engineering-assembly.pdf', kind: 'pdf' },
  { title: 'Construction Log', meta: '5 pages', file: 'construction-log.pdf', kind: 'pdf' },
  { title: 'Code Output', meta: 'SFE / BME envelopes · 12 pages', file: 'code-output.pdf', kind: 'pdf' },
  { title: 'Deliverable 1', meta: '2 pages', file: 'deliverable-1.pdf', kind: 'pdf' },
  {
    title: 'civ102-team107-script.py',
    meta: 'the main engine · Python · 314 lines',
    file: 'code/civ102-team107-script.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/civ102-bridge/civ102-team107-script.py?raw').then((m) => m.default),
  },
  {
    title: 'civ102-bridge-BME.py',
    meta: 'bending-moment envelope · Python · 79 lines',
    file: 'code/civ102-bridge-BME.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/civ102-bridge/civ102-bridge-BME.py?raw').then((m) => m.default),
  },
  {
    title: 'layers.py',
    meta: 'layer-stress solver · Python · 17 lines',
    file: 'code/layers.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/civ102-bridge/layers.py?raw').then((m) => m.default),
  },
  {
    title: 'layers_heatmap.py',
    meta: 'the heatmap above · Python · 43 lines',
    file: 'code/layers_heatmap.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/civ102-bridge/layers_heatmap.py?raw').then((m) => m.default),
  },
];

const ANALYSIS: CarouselSlide[] = [
  {
    src: `${MEDIA}/fig-fos.jpg`,
    alt: "Line plot titled 'All FOS': six factor-of-safety curves (compression yield, tension yield, flange buckling, web buckling, shear yield, shear buckling) against location from 0 to 1200 mm, with a dashed FOS = 1 line at the bottom that the compression curve nearly touches.",
    caption: 'Every failure mode, plotted along the span. The design lives just above the dashed FOS = 1 line.',
    width: 1600,
    height: 841,
  },
  {
    src: `${MEDIA}/fig-bme.jpg`,
    alt: "Line plot titled 'Bending Moment Envelope': maximum absolute bending moment against location, a smooth curve dipping to about −170,000 Nmm near the middle of the span.",
    caption: 'The bending-moment envelope: the worst moment at each point as the train rolls across.',
    width: 1600,
    height: 807,
  },
  {
    src: `${MEDIA}/fig-bmd-compare.jpg`,
    alt: 'Line plot comparing maximal bending moment for a single-layer track (a deep smooth curve to −185,000 Nmm) against a non-uniform track (a shallow saw-toothed curve staying above −50,000 Nmm).',
    caption: 'Why the track is layered: the non-uniform track (orange) sees a far gentler moment than a single layer (blue).',
    width: 1600,
    height: 1180,
  },
  {
    src: `${MEDIA}/fig-layer-table.jpg`,
    alt: "Table with columns 'Number of Layers', 'Range Unable to Support', and 'Length': 2 layers fail 183–1044 mm at 1250 mm length, down to 6 layers which support everywhere at 120 mm length.",
    caption: 'How many top layers each region needs: more layers, more of the span survives.',
    width: 1600,
    height: 849,
  },
  {
    src: `${MEDIA}/fig-cad-section.jpg`,
    alt: 'A dimensioned CAD drawing of the box girder cross-section: a 100 by 100 mm outline with 1.27 mm matboard wall thicknesses called out.',
    caption: 'The cross-section in CAD, dimensioned to the matboard thickness.',
    width: 1545,
    height: 1600,
  },
  {
    src: `${MEDIA}/fig-assembly-drawing.jpg`,
    alt: 'An engineering assembly drawing of the top-flange layers: a 120 mm outer width over a 100 mm inner box, 77.5 mm tall, with three stacked 1.27 mm layers detailed at the top.',
    caption: 'The assembly drawing, layer by layer.',
    width: 1600,
    height: 1122,
  },
  {
    src: `${MEDIA}/fig-section-areas.jpg`,
    alt: "Hand-drawn cross-section labelled 'Design Iteration 4' with areas A1 (top flange, width b, thickness t1), A2 (the two webs, height h, thickness t2), and A3 (the inner deck of n layers, width b − 2·t2).",
    caption: 'The same section by hand, with each area named for the calculations.',
    width: 1600,
    height: 1356,
  },
];

const MARKING: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-61.jpg`,
    alt: 'A teammate drawing cutting lines on the single sheet of blue matboard with a steel ruler and a wooden straightedge at the MYFab benches.',
    caption: 'Marking the cutting lines on the one sheet of matboard.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-62.jpg`,
    alt: 'A teammate bent low over the matboard checking a measurement with a steel ruler while another teammate watches from the next bench.',
    caption: "Each person's lines were double-checked by another.",
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-2.jpg`,
    alt: 'The marked matboard sheet on a workbench beside an iPad showing the cutting floorplan and a calculator.',
    caption: 'The floorplan on the iPad, the sheet on the bench.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-10.jpg`,
    alt: 'A teammate cutting along a marked line with a precision knife against a steel ruler.',
    caption: 'Precision-knife work, three hours of it.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-12.jpg`,
    alt: 'A teammate holding up a long freshly cut web strip of matboard.',
    caption: 'A web, freed from the sheet.',
    width: 1600,
    height: 1200,
  },
];

const GLUING: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-15.jpg`,
    alt: 'Cut matboard pieces arranged on a plastic sheet beside tubes of LePage contact cement in the CampusOne arts and crafts room.',
    caption: 'Gluing day: the pieces and the two tubes of contact cement.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-glue-annotated.jpg`,
    alt: 'A labelled photo of the gluing setup: two stacks of thick books marked "Bibles (Weight)" pressing the ends of a matboard strip, with a second strip below marked "Drying Glue".',
    caption: 'The setup, labelled: books for weight, strips left to dry.',
    width: 1600,
    height: 1006,
  },
  {
    src: `${MEDIA}/photo-17.jpg`,
    alt: 'Spreading contact cement onto a white matboard layer with a palette knife.',
    caption: 'Contact cement, spread thin with a palette knife.',
    width: 900,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-20.jpg`,
    alt: 'The gluing room: web strips taped to one table, top layers on another, and a stack of thick books used as weights.',
    caption: 'The room, mid-glue. Note the books on the right.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-26.jpg`,
    alt: 'Two glued web assemblies held with binder clips while the cement sets.',
    caption: 'Binder clips holding the webs while the cement sets.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-23.jpg`,
    alt: 'White matboard top-flange strips laid out to dry on a table beside a stack of thick hardcover volumes.',
    caption: 'The top layers drying, beside the books that took turns pressing them.',
    width: 1600,
    height: 1200,
  },
];

const ASSEMBLY: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-30.jpg`,
    alt: 'The U-channel taking shape: webs and soffit joined, blue diaphragms standing inside at intervals.',
    caption: 'The channel, with diaphragms waiting inside.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-41.jpg`,
    alt: 'The full open box girder seen from above, all diaphragms glued in place along its length.',
    caption: 'All diaphragms in, before the top went on.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-1.jpg`,
    alt: 'A teammate holding the open box girder upright in a hallway, diaphragms visible along its length.',
    caption: 'The open girder, held up for inspection.',
    width: 900,
    height: 1600,
  },
  {
    src: `${MEDIA}/photo-44.jpg`,
    alt: "The soffit strip pressed under a monitor stand and a library book titled 'Computing in Civil Engineering'.",
    caption: 'Pressing the soffit under a book called Computing in Civil Engineering.',
    width: 1600,
    height: 1200,
  },
];

const FINISHED: CarouselSlide[] = [
  {
    src: `${MEDIA}/photo-48.jpg`,
    alt: 'End view of the finished box girder cross-section on a table.',
    caption: 'The cross-section: two webs, a layered top, a soffit.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-50.jpg`,
    alt: 'The finished blue box girder lying diagonally across two tables, its full length visible.',
    caption: 'Finished, 11 p.m., November 20.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-46.jpg`,
    alt: 'The bridge spanning the gap between two tables, seen head-on down its length.',
    caption: 'Spanning the gap between two tables.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-58.jpg`,
    alt: 'Three thick hardcover volumes resting on the middle of the spanning bridge.',
    caption: 'The load: three volumes of The New Interpreter\'s Bible, over the one-metre span.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-59.jpg`,
    alt: 'The loaded bridge with a clear acrylic ruler taped vertically at one end to read deflection.',
    caption: 'A ruler taped at the end, to watch the deflection.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/photo-soffit-zoom.jpg`,
    alt: 'The loaded bridge with a red zoom callout magnifying the underside near midspan, highlighting the slight lift of the soffit under load.',
    caption: 'Zoomed in on the soffit under load, the lift we then fixed with glue tabs.',
    width: 1600,
    height: 1201,
  },
  {
    src: `${MEDIA}/photo-54.jpg`,
    alt: 'A teammate with both hands on his head, grinning at the loaded bridge.',
    caption: 'The reaction when the books stayed up.',
    width: 1600,
    height: 1200,
  },
];
// Test day, November 24: the apparatus from the handout, and the bridge in it.
const TESTDAY: CarouselSlide[] = [
  {
    src: `${MEDIA}/testday-1625.jpg`,
    alt: 'The three-car test train on a wooden stand: black steel cars with two wheels a side, a threaded rod rising from each, cables looping up to a steel beam overhead, and photos of the teaching staff taped to the sides.',
    caption: 'The train: three cars, 400 N together, cabled to the beam above so nothing falls with a bridge.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/testday-1626.jpg`,
    alt: 'The full testing rig along a row of benches: two wooden A-frames carrying a steel beam, the train parked at the near end, plywood support stacks and weight plates on the benches, and other teams\' bridges waiting behind.',
    caption: 'The rig: A-frames, a beam, plywood support stacks 1,200 mm apart. Three bridges are tested in a row.',
    width: 1600,
    height: 1200,
  },
  {
    src: `${MEDIA}/testday-1642.jpg`,
    alt: 'The blue Holy Bridge box girder seated on the support stacks between the A-frames, a teaching assistant in a hard hat and gloves checking it before the run.',
    caption: 'Seated on the supports, minutes before the run.',
    width: 1600,
    height: 1200,
  },
];

export function HolyBridge() {
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="The Holy Bridge" subtitle="CIV102 matboard bridge — Team 107, Fall 2025" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              Team 107 — Alan W., Luyu VK., and{' '}
              <a
                href="https://www.linkedin.com/in/henry-kim-uoft/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Henry Kim
              </a>{' '}
              (me)
            </p>
            <p>CIV102 Bridge Project, University of Toronto · TA: Christian Pavlidis</p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>
              The brief was simple to state and hard to meet: build a bridge that spans 1,200
              millimetres and carries a moving train load, using one sheet of matboard and two
              tubes of contact cement. Matboard is not a generous material: 30 MPa in tension, 6
              in compression, 4 in shear. With numbers that low over that span, the strength has
              to come from the shape of the cross-section.
            </p>
            <br />
            <p>
              Underneath the assignment was a research question, and the report states it as the
              objective: understand how failure mechanisms constrain the load a thin-plate
              structure can carry. Once you take that seriously, the questions turn quantitative.
              Given a fixed amount of a weak material and a fixed span, where is that material best
              spent, and which way of failing decides the answer? Everything we did after the
              first sketch was an attempt to answer that with numbers rather than intuition.
            </p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/holy-bridge.jpg`}
                alt="The three teammates at the testing event holding the finished blue box girder, with 'HOLY BRIDGE', 'TEAM 107', the three names, and 'Predicted: 548 N' hand-written on its side, one teammate holding a volume of The New Interpreter's Bible."
                width={1600}
                height={1200}
                loading="lazy"
              />
              <figcaption>
                Test day. The name, the team, and the prediction, in marker on the side.
              </figcaption>
            </figure>
            <p className="story-head">The method</p>
            <p>
              A moving load is harder to analyze than a fixed one, because the worst case is
              different at every point along the span. So the first thing we built was not a
              bridge but a model of the loading. We swept the train across the 1,200 millimetres
              in one-millimetre steps and, at each position, computed the shear force and bending
              moment everywhere along the bridge. Taking the worst value at each point over all
              train positions gives the shear-force and bending-moment envelopes, the two curves
              that say how hard the structure is pushed at every station. Those envelopes are the
              ground truth the rest of the investigation is measured against.
            </p>
            <br />
            <p>
              Against them we checked six independent ways the bridge could fail: crushing and
              tearing of the matboard, buckling of the compressed flange and of the tall thin
              webs, and two kinds of shear failure. Each has its own equation, and each produces
              its own factor of safety at every point on the span. The design is only as strong as
              its weakest mode at its weakest point, so the real object of study was that lower
              envelope of factors of safety, and the question became how to raise it with the
              material we had.
            </p>
            <br />
            <p className="story-head">Seven designs on paper</p>
            <p>
              With that machinery in place, the seven iterations in the report are really seven
              experiments, each one asking the equations where material was being wasted. Buckling
              was the recurring answer. A thin plate buckles at a stress that scales with the
              square of its thickness-to-width ratio, so slender, unsupported spans of matboard
              give out long before the material itself would crush. We added internal diaphragms
              to keep the box from racking into a parallelogram under shear, and we layered the
              compression flange rather than the whole deck, because every failure equation
              improves with the second moment of area and that is where the bending moment
              concentrates.
            </p>
            <br />
            <p>
              The height and width were not guessed but solved. The factor of safety against
              bending rises roughly with the square of the section height, while the factor
              against web buckling falls with its square, so the two pull in opposite directions.
              The most efficient height is the one where the web buckles and the material yields at
              the same stress, because beyond that height the web gives out before the extra
              material can help. Solving that condition gave 74 millimetres of web and 121 of
              flange, which we then rounded to the project's 20-millimetre height increments and to
              what a knife can honestly cut.
            </p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/layer-heatmap.jpg`}
                alt="Heatmap titled 'Deck Stress vs. Layer Amounts (Darker is Better)': number of top layers on the vertical axis, bottom layers on the horizontal, with a red diagonal marking the four-layer area constraint. The darkest cells sit toward more top layers."
                width={1600}
                height={1217}
                loading="lazy"
              />
              <figcaption>
                Deck stress across every top-and-bottom layer combination. The red line is the
                material we actually had; darker is better.
              </figcaption>
            </figure>
            <p>
              Iteration seven exists because the investigation caught its own mistake. We had
              optimized so aggressively against compression and buckling that we removed the
              bottom layer entirely, and only later, re-running the checks, found we had never
              properly tested failure by tension. The numbers came back wrong. The bottom layer
              went back in, which shifted the governing failure to shear through the new glue
              joints, which is why the finished bridge has glue tabs along the soffit. Re-running
              the checks is what caught it, and the report says so plainly, which I like.
            </p>
            <br />
            <p className="story-head">The code</p>
            <p>
              Under the design sits a set of Python scripts. They sweep the train across the span
              and build shear force and bending moment envelopes, compute the factor of safety
              against every failure mode we knew, and solve for how long each top layer needs to
              be. The final run predicted a failure load of 1,096 newtons, with the weakest point
              at x = 379 millimetres and a factor of safety of 1.009 there. In other words, the
              design uses up its material almost exactly, which is what the optimization was for.
              The number we wrote on the bridge on test day, 548 N, is the working-load prediction
              we carried into the competition. The scripts that did all this, the main solver, the
              bending-moment envelope, the layer-stress calculation, and the one that drew the
              heatmap above, are in the shelf below, next to the reports. The full output, graphs
              included, is there too.
            </p>
            <br />
            <FigureCarousel slides={ANALYSIS} label="The analysis, in graphs" />
            <p>
              The graph that best captures the whole design is the first one: all six failure
              modes plotted along the span, every curve sitting just above the dashed line where
              the factor of safety equals one. That narrow gap is the entire point. A bridge that
              clears every mode by a wide margin has wasted material; ours clears them by almost
              nothing, on purpose.
            </p>
            <br />
            <p className="story-head">Two nights of building</p>
            <p>
              Construction took two evenings, five days before testing so the cement could cure.
              On November 19 we marked and cut the sheet at the Myhal fabrication facility, with
              permission from the supervisors: tape measure and rulers against a prepared
              floorplan, every line double-checked by a second person, three hours of precision
              knife work.
            </p>
            <br />
            <FigureCarousel slides={MARKING} label="Marking and cutting the matboard" />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/cutting.mp4`}
                controls
                playsInline
                preload="metadata"
                width={1280}
                height={720}
                aria-label="Video: tracing and cutting the matboard at the fabrication facility"
              />
              <figcaption>Cutting night, in motion.</figcaption>
            </figure>
            <p>
              The next evening we glued, in a CampusOne room chosen for its ventilation. One
              teammate could not join for medical reasons, so two of us finished the glue-up. The
              order of operations mattered: every joint needed pressure while it set, which is how
              a stack of borrowed hardcovers, volumes of The New Interpreter's Bible, became our
              clamping weights. The name of the bridge followed from there.
            </p>
            <br />
            <FigureCarousel slides={GLUING} label="Gluing the layers" />
            <figure className="story-figure story-clip">
              <video
                src={`${MEDIA}/gluing.mp4`}
                controls
                playsInline
                preload="metadata"
                width={1280}
                height={720}
                aria-label="Video: applying contact cement during the glue-up"
              />
              <figcaption>The glue-up.</figcaption>
            </figure>
            <FigureCarousel slides={ASSEMBLY} label="Assembling the box girder" />
            <p>
              The finished section is a closed box: a soffit, two webs, a layered top flange, and
              eight diaphragms standing inside it. Here it is built from the assembly drawing,
              every piece, blue side out. Drag the slider and the bridge lays itself back onto the
              one sheet it was cut from; X-ray shows the diaphragms and the splice patches —
              and that there is no patch on the top sheet.
            </p>
            <br />
            <BridgeStudio />
            <p className="story-head">The Bible test</p>
            <p>
              Before we closed the box, we gave it our own test: the bridge suspended over the
              one-metre span between two tables, the same books that had clamped it now loading
              it, with an acrylic ruler taped at one end to watch the deflection. This is the test
              that earned its keep. Around 20 kilograms it showed minor web buckling, and the
              soffit lifted near the diaphragms where a roughly one-millimetre height mismatch kept
              it from seating. Some pieces also had to be patched from offcuts.
            </p>
            <br />
            <FigureCarousel slides={FINISHED} label="The finished bridge and the light-load test" />
            <p>
              None of that was fatal, and all of it was fixable. We added glue tabs to hold the
              soffit to the webs, the connection the calculations already assume exists. The
              patched joints we treated as harmless, because the analysis models each layer as a
              single discrete piece. That assumption is the one that would come back to bite us. By
              11 p.m. on November 20 the box was closed.
            </p>
            <p className="story-head">The report itself</p>
            <p>
              Everything above is a retelling. The design report is the real record, nine pages of
              it, and it reads right here, in full, without leaving the page.
            </p>
            <br />
            <PdfFlow src={`${MEDIA}/design-report.pdf`} title="Box Girder Bridge Design Report" />
            <p>
              The rest of the engineering record sits alongside it: nineteen pages of hand
              calculations, the assembly drawings, the construction log, and the code output with
              every envelope and factor of safety. Each opens right on this page too.
            </p>
            <br />
            <DocShelf docs={DOCS} base={MEDIA} />
            <p className="story-head">Test day</p>
            <p>
              The prediction was 1,096 newtons. The bridge failed at 133. That is not a small miss;
              it is the prediction off by a factor of eight, and it is the most useful thing this
              project taught me.
            </p>
            <br />
            <FigureCarousel slides={TESTDAY} label="Test day" />
            <p>
              It did not fail anywhere the analysis pointed. It failed at a splice. To reach the
              full length from one sheet, we had joined shorter pieces end to end, and one of those
              joints sat in the top flange, the part of the bridge in compression. We had treated
              that joint as harmless, the way the model does, as if the layer were one continuous
              piece. Under load it was not. The compression had nowhere to cross the unreinforced
              seam, so the flange hinged there and folded into a sharp V, and the whole section
              went with it. It had held the Bibles a few nights earlier because those books sat
              spread along the whole span; the competition load comes through a rig, concentrated
              where the books had been distributed, so the splice carried far more than it ever
              had under the informal test.
            </p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/photo-failure.jpg`}
                alt="The broken bridge: the top flange has torn and folded into a sharp V-shape at a splice joint where two matboard pieces were joined end to end, the two halves of the deck angling down from the break."
                width={1200}
                height={1600}
                loading="lazy"
              />
              <figcaption>
                Where it broke: the top-flange splice, folded into a V. The failure started here,
                not at the weakest point the math had named.
              </figcaption>
            </figure>
            <p>
              And here is the run itself, on the model: the rig from the handout, the train, and
              the one seam the analysis was never told about.
            </p>
            <br />
            <BridgeStudio variant="testday" />
            <p>
              So the number the research produced was real, but it was the failure load of the
              bridge we designed, not the bridge we built. The two differed at exactly one place:
              a discontinuity the analysis was never told about. A continuous compression flange
              carries load across its whole length; a spliced one is only as strong as the seam,
              and an unreinforced seam in the most-compressed part of the structure is the worst
              place to put it. The fix is not subtle in hindsight. Reinforce the splice with an
              overlapping doubler and extra glue tabs, or plan the cut layout so the compression
              flange is one uncut piece, or at least move any unavoidable joint away from midspan
              where the moment is highest. We had spent the whole design optimizing the modes we
              modeled and almost no attention on the joint we improvised.
            </p>
            <br />
            <p>
              That gap between 1,096 and 133 is the lesson, and it is a better one than a pass
              would have been. The equations narrowed the shape and the code checked them across
              every train position, but the model only knows what you tell it, and we never told
              it about the seam. The part I kept from this is a specific kind of suspicion: the
              failure rarely waits at the point your analysis worked hardest to protect. It waits
              at the detail you decided was too small to model.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
