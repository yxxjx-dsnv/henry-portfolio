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
      <Hero title={t('Henry Kim')} playful subtitle={`last updated: ${profile.lastUpdated.home}`} />
      <DotField />
      <DailyQuote />
      <section className="about-section">
        <div className="text">
          <p>Some things about me:</p>
          <div className="section-title">
            <li>
              {tx('19, born in {korea}. Second-year Electrical & Computer Engineering (ECE) student at the {uoft}.', {
                korea: <KoreaTrigger>{t('South Korea')}</KoreaTrigger>,
                uoft: ext('https://www.utoronto.ca', t('University of Toronto')),
              })}
            </li>
            <br />
            <li>
              {tx(
                "As of August 2026 I've joined {incheon} (주식회사 인천로보틱스) as an {role}. They build grid-based warehouse robots. My job is {job} that lets an operator control the whole system without touching the screen. I work on the robot build too. It all lives on {page}.",
                {
                  incheon: ext('https://incheonrobotics.com', 'Incheon Robotics'),
                  role: <u><b>{t('AI/Robotics Engineering Intern')}</b></u>,
                  job: <u><b>{t('implementing AI/ML voice recognition system')}</b></u>,
                  page: <Link to="/projects/incheon-robotics">{t('its own page')}</Link>,
                },
              )}
            </li>
            <br />
            <li>
              {tx(
                "Before that I spent about three months as a freelance {role} at Branphic Inc. I designed, built, deployed, and maintained 9+ internal automation tools with {claude}, {chatgpt}, and {codex}, which moved the company's day-to-day operations onto AI automation.",
                {
                  role: <u><b>{t('AX engineer')}</b></u>,
                  claude: ext('https://claude.com/product/claude-code', 'Claude Code'),
                  chatgpt: ext('https://chat.openai.com', 'ChatGPT'),
                  codex: ext('https://openai.com/blog/openai-codex', 'OpenAI Codex'),
                },
              )}
            </li>
            <br />
            <li>
              {tx(
                "({hold}) I'm building a startup called {mono}. It uses AI and automation to analyze global resale markets and helps users find profitable opportunities faster. I lead it as Founder & CEO.",
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
              {tx("Now I'm an Executive member of the Event Dept. at {utkesa}.", {
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
                  "{b}: especially where automation, Artificial Intelligence(AI), and user experience meet. I like tools that make life simpler or make something new possible.",
                  { b: <b>Technology and startups</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b}: I like clean, intentional design, in digital products and in how people communicate. Good design, to me, feels intuitive and doesn't waste the user's time.",
                  { b: <b>Design and clarity</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b}: I teach myself new skills and use them right away. Web development, writing, data analysis, and business strategy all came that way.",
                  { b: <b>Independent learning</b> },
                )}
              </li>
              <br />
              <li>
                {tx(
                  "{b}: I've seen what student-led groups can do. I want to keep leading that way, with action and empathy.",
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
