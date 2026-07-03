import { Hero } from '../components/Hero';
import { KoreaTrigger } from '../components/KoreaEasterEgg';
import { DotField } from '../components/DotField';
import { Greeting } from '../components/Greeting';
import { profile } from '../data/profile';

export function Home() {
  return (
    <section className="section">
      <Hero title="Henry Kim" playful subtitle={`last updated: ${profile.lastUpdated.home}`} />
      <DotField />
      <Greeting />
      <section className="about-section">
        <div className="text">
          <p>Some things about me:</p>
          <div className="section-title">
            <li data-reveal>
              18-years-old, born in <KoreaTrigger>South Korea</KoreaTrigger> — First Year
              TrackOne(Undeclared Engineering) student at the{' '}
              <a href="https://www.utoronto.ca" target="_blank" rel="noopener noreferrer">
                University of Toronto
              </a>
              .
            </li>
            <br />
            <li data-reveal>
              (
              <u>
                <b>On hold</b>
              </u>
              ) I'm building a startup called{' '}
              <a target="_blank" rel="noopener noreferrer">
                MONO
              </a>
              , which uses AI and automation to analyze global resale markets, helping users identify
              profitable opportunities more efficiently. I lead the project as the Founder &amp; CEO.
            </li>
            <br />
            <li data-reveal>
              Previously, I served as a Project Leader at WGSS Grad Council 2025, President of the WGSS
              LEO Club, and Co-President of Unity 4 Charity (U4C).
            </li>
            <br />
            <li data-reveal>
              Now, I served as an Executive member in Event Dept. at{' '}
              <a href="https://www.instagram.com/utkesa_official/" target="_blank" rel="noopener noreferrer">
                UTKESA
              </a>
            </li>
            <br />
            <li data-reveal>I enjoy combining technology, design, and systems thinking to solve practical problems.</li>
          </div>
          <br />
          <br />
          <div className="text">
            <p>Some things I'm interested in:</p>
            <div className="section-title">
              <li data-reveal>
                <b>Technology and startups</b> — especially where automation, artificial intelligence,
                and user experience intersect. I'm fascinated by tools that can simplify life or create
                new possibilities.
              </li>
              <br />
              <li data-reveal>
                <b>Design and clarity</b> — I value clean, intentional design in both digital products
                and communication. Good design, to me, makes things feel intuitive and respectful of the
                user's time.
              </li>
              <br />
              <li data-reveal>
                <b>Independent learning</b> — I like teaching myself new skills and using them
                immediately: web development, writing, data analysis, and business strategy are all
                things I've explored hands-on.
              </li>
              <br />
              <li data-reveal>
                <b>Education and leadership</b> — I've seen firsthand how student-led initiatives can
                create meaningful impact. I hope to keep exploring leadership grounded in action and
                empathy.
              </li>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
