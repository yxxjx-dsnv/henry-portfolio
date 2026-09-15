import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { KoreaTrigger } from '../components/KoreaEasterEgg';
import { DotField } from '../components/DotField';
import { DailyQuote } from '../components/DailyQuote';
import { profile } from '../data/profile';
import { useLang } from '../i18n';

export function Home() {
  const { t, tx } = useLang();
  const ext = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
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
              {tx('19-years-old, born in {korea} — Second Year Electrical & Computer Engineering (ECE) student at the {uoft}.', {
                korea: <KoreaTrigger>{t('South Korea')}</KoreaTrigger>,
                uoft: ext('https://www.utoronto.ca', t('University of Toronto')),
              })}
            </li>
            <br />
            <li>
              {tx(
                "As of August 2026 I've joined {incheon} (주식회사 인천로보틱스) as an {role}. They build grid-based warehouse robots. My job is implementing AI/ML voice recognition that lets an operator control the whole system without touching the screen. I work on the robot build too. It all lives on {page}.",
                {
                  incheon: ext('https://incheonrobotics.com', 'Incheon Robotics'),
                  role: <b>{t('AI/Robotics Engineering Intern')}</b>,
                  page: <Link to="/projects/incheon-robotics">{t('its own page')}</Link>,
                },
              )}
            </li>
            <br />
            <li>
              {tx(
                "Before that I spent about three months as a freelance {role} at Branphic Inc., where I designed, built, deployed, and maintained 9+ internal automation tools end to end — working across Claude, ChatGPT, and Codex — moving the company's day-to-day operations onto AI automation.",
                { role: <b>{t('AX engineer')}</b> },
              )}
            </li>
            <br />
            <li>
              {tx(
                "({hold}) I'm building a startup called {mono}, which uses AI and automation to analyze global resale markets, helping users identify profitable opportunities more efficiently. I lead the project as the Founder & CEO.",
                {
                  hold: (
                    <u>
                      <b>{t('On hold')}</b>
                    </u>
                  ),
                  mono: (
                    <a target="_blank" rel="noopener noreferrer">
                      MONO
                    </a>
                  ),
                },
              )}
            </li>
            <br />
            <li>
              {t('Previously, I served as a Project Leader at WGSS Grad Council 2025, President of the WGSS LEO Club, and Co-President of Unity 4 Charity (U4C).')}
            </li>
            <br />
            <li>
              {tx('Now, I served as an Executive member in Event Dept. at {utkesa}', {
                utkesa: ext('https://www.instagram.com/utkesa_official/', 'UTKESA'),
              })}
            </li>
            <br />
            <li>{t('I enjoy combining technology, design, and systems thinking to solve practical problems.')}</li>
          </div>
          <br />
          <br />
          <div className="text">
            <p>Some things I'm interested in:</p>
            <div className="section-title">
              <li>
                {tx(
                  "{b} — especially where automation, artificial intelligence, and user experience intersect. I'm fascinated by tools that can simplify life or create new possibilities.",
                  { b: <b>Technology and startups</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b} — I value clean, intentional design in both digital products and communication. Good design, to me, makes things feel intuitive and respectful of the user's time.",
                  { b: <b>Design and clarity</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b} — I like teaching myself new skills and using them immediately: web development, writing, data analysis, and business strategy are all things I've explored hands-on.",
                  { b: <b>Independent learning</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b} — I've seen firsthand how student-led initiatives can create meaningful impact. I hope to keep exploring leadership grounded in action and empathy.",
                  { b: <b>Education and leadership</b> },
                )}
              </li>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
