import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { useLang } from '../i18n';
import { DocShelf, type ShelfDoc } from '../components/DocShelf';
import { PdfDeck } from '../components/PdfDeck';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';
import { AutoVideo } from '../components/AutoVideo';
import { CampusPulseDash } from '../components/CampusPulseDash';

const MEDIA = '/media/campus-pulse';

// The person-detector recorded on three source feeds, each mapped to a building.
const DETECTION: CarouselSlide[] = [
  {
    src: `${MEDIA}/detect-gerstein.mp4`,
    alt: "A window titled 'Campus Pulse — gerstein-library#2F' plays busy library footage with a green box drawn around every person and '23 person(s)' counted in green at the top.",
    caption: 'The detector on the busiest feed, gerstein-library#2F, boxing and counting 23 people at once.',
    width: 960,
    height: 590,
    kind: 'video',
  },
  {
    src: `${MEDIA}/detect-bahen.mp4`,
    alt: "A window titled 'Campus Pulse — bahen-centre#2F' plays office CCTV footage with a green box tracking each person and a live count at the top.",
    caption: 'The same detector on the feed tagged bahen-centre#2F.',
    width: 960,
    height: 592,
    kind: 'video',
  },
  {
    src: `${MEDIA}/detect-sidney.mp4`,
    alt: "A window titled 'Campus Pulse — sidney-smith#2F' plays study-space footage with a green box on each detected person and the count updating live.",
    caption: 'And the sidney-smith#2F feed.',
    width: 960,
    height: 592,
    kind: 'video',
  },
];

const DECK_NOTES = [
  'Title slide: Campus Pulse, a real-time campus facility occupancy dashboard, by Team 4: Junwhan, Henry, Suyeon, and Byeongmin.',
  'The problem: students move all day between libraries, gyms, study spaces, and dining halls, with no real-time signal of how full each floor is, so they keep walking into crowded rooms and wasting the trip.',
  'The pipeline, from the top: camera sensors capture raw video of a study space. (This is where I opened the architecture walkthrough.)',
  'Amazon Rekognition turns that video into a numerical headcount, detecting people frame by frame without us training a model of our own.',
  'The detector running on a real frame: every person boxed, with "gerstein-library#2F | 26 person(s)" counted live in the corner.',
  'The headcounts are written to and continuously updated in DynamoDB. (My slide.)',
  'A Lambda function reads from DynamoDB, organizes the numbers, and generates the API response.',
  'API Gateway serves that response to the React frontend, which draws the occupancy floor by floor in real time.',
  'What students see: real-time building density, floor-by-floor occupancy in percentages and colour, the least-crowded facility, and a crowd trend over time.',
  'The live dashboard: per-floor density cards (2F at 96%, 4F at 35%) and the day’s occupancy trend, peaking in the mid-afternoon.',
  'Future steps: library room-booking status, a GPS route map, AI trend prediction, an emergency alert tied to density, and expansion to dining halls and rest spaces.',
  'The demo: a QR code to the live Campus Pulse site, hosted on AWS API Gateway. (My slide again.)',
  'Thank you.',
];

const DOCS: ShelfDoc[] = [
  {
    title: 'video_processor.py',
    meta: 'the Rekognition engine · Python · 232 lines',
    file: 'code/video_processor.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/campus-pulse/video_processor.py?raw').then((m) => m.default),
  },
  {
    title: 'api.py',
    meta: 'the Lambda API · Python · 118 lines',
    file: 'code/api.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/campus-pulse/api.py?raw').then((m) => m.default),
  },
  {
    title: 'aws_bootstrap.py',
    meta: 'infrastructure setup · Python · 111 lines',
    file: 'code/aws_bootstrap.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/campus-pulse/aws_bootstrap.py?raw').then((m) => m.default),
  },
  {
    title: 'config.py',
    meta: 'building & floor model · Python · 71 lines',
    file: 'code/config.py.txt',
    kind: 'code',
    lang: 'python',
    loadSource: () => import('../assets/campus-pulse/config.py?raw').then((m) => m.default),
  },
  {
    title: 'campus-pulse.tsx',
    meta: 'the dashboard · React · 967 lines',
    file: 'code/campus-pulse.tsx.txt',
    kind: 'code',
    lang: 'tsx',
    loadSource: () => import('../assets/campus-pulse/campus-pulse.tsx.txt?raw').then((m) => m.default),
  },
  {
    title: 'deploy.sh',
    meta: 'S3 & API deployment · shell · 168 lines',
    file: 'code/deploy.sh.txt',
    kind: 'code',
    lang: 'sh',
    loadSource: () => import('../assets/campus-pulse/deploy.sh?raw').then((m) => m.default),
  },
];

const TEAM = [
  { name: 'Joshua Choi', url: 'https://www.linkedin.com/in/joshua-choi-416-uoft/' },
  { name: 'Suyeon Lee', url: 'https://www.linkedin.com/in/suyeon-lee-443333393/' },
  { name: 'Byeongmin Nam', url: 'https://www.linkedin.com/in/byeongmin-nam-50a6852a0/' },
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

export function CampusPulse() {
  const { t, tx } = useLang();
  const slides = DETECTION.map((s) => ({ ...s, alt: t(s.alt), caption: t(s.caption) }));
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; All projects
      </Link>
      <Hero title="Campus Pulse" subtitle="IEEE × AWS hackathon — March 13, 2026" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              {tx('Team 6SIX7: {members}, and {me} (me)', {
                members: TEAM.map((m, i) => (
                  <span key={m.name}>
                    {i > 0 && ', '}
                    <a href={m.url} target="_blank" rel="noopener noreferrer">
                      {m.name}
                    </a>
                  </span>
                )),
                me: (
                  <a href="https://www.linkedin.com/in/henry-kim-uoft/" target="_blank" rel="noopener noreferrer">
                    Henry Kim
                  </a>
                ),
              })}
            </p>
            <p>
              <a
                href="https://github.com/yxxjx-dsnv/AWS-Hackathon-project-Campus_Pulse"
                target="_blank"
                rel="noopener noreferrer"
              >
                Code
              </a>
              {' · '}
              <a
                href="https://devpost.com/software/campus-pulse-1u9aoy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Devpost
              </a>
            </p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <figure className="story-figure">
              <img
                src={`${MEDIA}/logo.jpg`}
                alt={t("The Campus Pulse logo: navy line-art of campus towers rising into a bar chart and a pulse curve, above the wordmark 'CAMPUS PULSE'.")}
                width={1127}
                height={675}
                loading="lazy"
              />
              <figcaption>{t("The Campus Pulse logo.")}</figcaption>
            </figure>
            <p>{t("My first hackathon was on March 13, 2026, at Amazon's Toronto office at 18 York Street. IEEE called the event \"Hack the Student Life\": nine hours, from eight in the morning to five in the afternoon, to build something real around a problem of student life at U of T. I had never used AWS before, and I was nervous, but I wanted to see what I could build in one day.")}</p>
            <br />
            <Figure
              src={`${MEDIA}/photo-1.jpg`}
              alt={t("Students seated at long tables during the opening presentation; the screen reads 'Welcome to AWS Canada YYZ18 — IEEE Hack the Student Life Event'.")}
              caption={t("8 a.m. at Amazon Toronto (YYZ18): the opening talk, before the teams scattered.")}
              width={1200}
              height={1600}
            />
            <p className="story-head">Why I signed up</p>
            <p>{t("The application form asked why I wanted to attend. I wrote that small problems in campus life had been bothering me for a while. Information is scattered across department websites, email newsletters, Quercus announcements and club social media, and more than once I found out about a lecture I wanted only after registration had closed. Students end up doing the searching that software should do for them. I wanted to stop just noticing that and try to analyze and redesign the system under one of those problems.")}</p>
            <br />
            <p>{t("Building MONO, my resale analytics platform, had taught me that I could ship software around a real problem: it collected inventory from retail sites, compared retail prices against resale prices, and calculated the margins. But everything I had built so far ran on tools I already knew. Under the question about AWS experience I wrote the only thing I could write: that I had none, and that I was prepared to learn quickly.")}</p>
            <br />
            <p className="story-head">Choosing the problem</p>
            <p>{t("The problem we picked was an ordinary one, and all four of us had lived it. During midterm season you walk to Robarts, take the elevator up, walk the floor, find nothing, and repeat the loop in the next building. Thousands of students hunt for seats at the same time, and there is no live signal telling you where not to bother going.")}</p>
            <br />
            <p>{t("Deciding how to measure occupancy was the part of the day I learned the most from. Our first idea was counting devices on campus Wi-Fi. It sounded clever until we said \"track everyone's phones\" out loud, and we dropped it. The second was T-card tap data, which fails on coverage: only a few buildings, like Robarts and Gerstein, have T-card gates at all, so it could never cover the whole campus. What survived was the simplest idea: point a camera at a study space, count the people in frame, and compare the count to the floor's seat capacity. It measures the thing a student actually cares about, which is seats.")}</p>
            <br />
            <p className="story-head">What we built</p>
            <p>{t("The system we built is a straight line. Video frames from a study space go to Amazon Rekognition, which detects people without us training any model of our own. A Python processor turns the detections into headcounts, the headcounts land in DynamoDB, a Lambda function behind API Gateway serves them, and a React dashboard reads the API. By mid-afternoon the dashboard was live on a public URL. I remember refreshing the page on an iPad and feeling amazed that something we had planned at breakfast was now on the internet.")}</p>
            <br />
            <p>
              {tx(
                'The counting itself is the first link in that chain. Our {file} (in the shelf below) reads a study-space video frame by frame, sends each frame to Rekognition, and draws a box around every person it finds before writing the headcount out. Here it is running on three source feeds, one mapped to each building.',
                { file: <code>video_processor.py</code> },
              )}
            </p>
            <br />
            <FigureCarousel slides={slides} label={t("The person-detector running on each building's feed")} />
            <Figure
              src={`${MEDIA}/photo-4.jpg`}
              alt={t("Campus Pulse dashboard on a tablet: 'Live Campus Occupancy Dashboard' showing Sidney Smith as the best location at 26% occupied and Robarts at 58%.")}
              caption={t("Mid-afternoon: the dashboard, live on its public URL (shown here in demo view).")}
              width={1600}
              height={1117}
            />
            <p>{t("The dashboard shows a percentage for every floor, low / mid / high color bands, a \"best location right now\" answer at the top, a daily trend line, and building alerts for things like a broken elevator. When we presented, I did the architecture walkthrough for the judges and explained our pipeline as simply as I could, having learned these services that morning.")}</p>
            <br />
            <p>{t("The dashboard itself is below, ported from our React source. You can search or sort the directory, open a building for its floors and daily trend, switch between cards and table, and watch the occupancy refresh every few seconds.")}</p>
            <br />
            <CampusPulseDash />
            <p className="doc-note">
              {t('This copy runs on the presentation data; the real one read live counts from the AWS pipeline.')}
            </p>
            <figure className="story-figure">
              <AutoVideo
                src={`${MEDIA}/demo.mp4`}
                width={1440}
                height={934}
                alt={t("Screen recording of the Campus Pulse dashboard in use")}
              />
              <figcaption>{t("The demo, recorded on the iPad at 2:26 that afternoon.")}</figcaption>
            </figure>
            <p className="story-head">The deck we presented</p>
            <p>{t("The slides, with a note under each on what it covered and who presented it.")}</p>
            <br />
            <PdfDeck src={`${MEDIA}/deck.pdf`} title="Campus Pulse presentation" captions={DECK_NOTES.map(t)} />
            <p>{t("The code behind the system opens here too:")}</p>
            <br />
            <DocShelf docs={DOCS} base={MEDIA} />
            <p className="story-head">The team</p>
            <p>{t("Campus Pulse was built by four people who had mostly just met: Joshua, Suyeon, Byeongmin, and me, registered under the team code 6SIX7. We split the work roughly along the pipeline. Detection and the AWS setup went to one side, the dashboard and its data to the other, and we merged everything in the final hours. Building MONO had taught me the hard way to break a problem into smaller units, put structure ahead of speed, and test while building instead of after. We spent the first half hour agreeing on what we would not build, which paid off at the end of the day when everything had to be merged at once.")}</p>
            <br />
            <Figure
              src={`${MEDIA}/photo-2.jpg`}
              alt={t("The four teammates posing around a large AWS cloud-logo sign in front of a wall patterned with binary digits.")}
              caption={t("Team 6SIX7, in front of the AWS sign.")}
              width={1600}
              height={1326}
            />
            <p className="story-head">What I learned</p>
            <p>{t("The concrete lessons were about AWS. Rekognition gives you working computer vision without training or hosting a model of your own. DynamoDB stores and serves the readings, Lambda and API Gateway turn a function into an API, and a static site on S3 becomes a URL anyone can open. I had never used AWS before that morning, and by the afternoon our service was on a public URL.")}</p>
            <br />
            <p>{t("The other lesson was about being honest in design. Twice that day we gave up an idea that sounded impressive for one that would work: when we chose the sensor, and again when we cut the features down to what could be real by 5 p.m. I try to remember that whenever one of my projects starts getting too ambitious.")}</p>
            <br />
            <p className="story-head">Where this goes</p>
            <p>{t("The obvious next steps are room booking on top of the live map, occupancy prediction once the readings build up a history, better alerts, and more buildings. What I care about more is the idea I put in the application: campus information is scattered, and it should work like one system. I had sketched it there, one place where every campus event can be found and joined in a click, synced to your calendar, with deadlines that come to you. Campus Pulse is the first piece of that I have built and put on the internet.")}</p>
            <br />
            <Figure
              src={`${MEDIA}/photo-3.jpg`}
              alt={t("Henry standing beside the large AWS cloud sign.")}
              caption={t("After the event ended, on the way out.")}
              width={1132}
              height={1600}
            />
            <p>{t("On the application I promised that I would learn quickly. Leaving at five o'clock, I felt I had kept that promise at least once.")}</p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
