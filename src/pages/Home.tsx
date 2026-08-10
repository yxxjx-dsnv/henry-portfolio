import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { KoreaTrigger } from '../components/KoreaEasterEgg';
import { DotField } from '../components/DotField';
import { DailyQuote } from '../components/DailyQuote';
import { profile } from '../data/profile';

export function Home() {
  return (
    <section className="section">
      <Hero title="Henry Kim" playful subtitle={`last updated: ${profile.lastUpdated.home}`} />
      <DotField />
      <DailyQuote />
      <section className="about-section">
        <div className="text">
          <p>Some things about me:</p>
          <div className="section-title">
            <li>
              19-years-old, born in <KoreaTrigger>South Korea</KoreaTrigger> — Second Year
              Electrical &amp; Computer Engineering (ECE) student at the{' '}
              <a href="https://www.utoronto.ca" target="_blank" rel="noopener noreferrer">
                University of Toronto
              </a>
              .
            </li>
            <br />
            <li>
              As of August 2026 I've joined{' '}
              <a href="https://incheonrobotics.com" target="_blank" rel="noopener noreferrer">
                Incheon Robotics
              </a>{' '}
              (주식회사 인천로보틱스) as an <b>AI/Robotics Engineering Intern</b>. They build
              grid-based warehouse robots. My job is implementing AI/ML voice recognition that lets
              an operator control the whole system without touching the screen. I work on the robot
              build too. It all lives on{' '}
              <Link to="/projects/incheon-robotics">its own page</Link>.
            </li>
            <br />
            <li>
              Before that I spent about three months as a freelance <b>AX engineer</b> at Branphic
              Inc., where I designed, built, deployed, and maintained 9+ internal automation tools
              end to end — working across Claude, ChatGPT, and Codex — moving the
              company's day-to-day operations onto AI automation.
            </li>
            <br />
            <li>
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
            <li>
              Previously, I served as a Project Leader at WGSS Grad Council 2025, President of the WGSS
              LEO Club, and Co-President of Unity 4 Charity (U4C).
            </li>
            <br />
            <li>
              Now, I served as an Executive member in Event Dept. at{' '}
              <a href="https://www.instagram.com/utkesa_official/" target="_blank" rel="noopener noreferrer">
                UTKESA
              </a>
            </li>
            <br />
            <li>I enjoy combining technology, design, and systems thinking to solve practical problems.</li>
          </div>
          <br />
          <br />
          <div className="text">
            <p>Some things I'm interested in:</p>
            <div className="section-title">
              <li>
                <b>Technology and startups</b> — especially where automation, artificial intelligence,
                and user experience intersect. I'm fascinated by tools that can simplify life or create
                new possibilities.
              </li>
              <br />
              <li>
                <b>Design and clarity</b> — I value clean, intentional design in both digital products
                and communication. Good design, to me, makes things feel intuitive and respectful of the
                user's time.
              </li>
              <br />
              <li>
                <b>Independent learning</b> — I like teaching myself new skills and using them
                immediately: web development, writing, data analysis, and business strategy are all
                things I've explored hands-on.
              </li>
              <br />
              <li>
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
