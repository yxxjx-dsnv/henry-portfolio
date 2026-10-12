import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { PdfDeck } from '../components/PdfDeck';
import { Photo } from '../components/Expandable';
import { useLang } from '../i18n';

const MEDIA = '/media/mono';

// ÆRIOUS: the startup I am building. MONO, its first attempt, is the
// second half of the page (#mono; /projects/mono lands there).
export function Aerious() {
  const { t, tx } = useLang();
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  const deckNotes = [
    t('Title: how my Capstone turned into learning to code, building a website, and preparing my AI startup, MONO.'),
    t('The original goal: build MONO, a startup that uses automation and AI to run a profitable, scalable reselling platform. To get there I needed web development, programming, and AI basics.'),
    t('Why this question: I had resold limited products online myself. It was manual and slow, so I wanted an AI system that made it easier and more profitable for anyone.'),
    t('What MONO is: a platform that finds profitable products, scores them on cost, fees, demand, and competitors, lists the best ones automatically, and adjusts prices to stay competitive. The name means doing it in one step.'),
    t('To build MONO’s AI I first had to understand how AI works and improve my programming, so I started with the fundamentals.'),
    t('The pivot: without coding I could not build MONO, so I decided to build my personal portfolio website first, to practice.'),
    t('What the site needed: a domain and hosting. I learned HTML for structure, CSS for styling, and JavaScript for interactivity, with ChatGPT for questions and GitHub for version control.'),
    t('I bought henrykim.ca on GoDaddy and used DNS settings to connect it to GitHub Pages for free hosting.'),
    t('Proof it is live: the domain receipt, the DNS settings, and the GitHub Pages link.'),
    t('Coding the site from scratch in VS Code, with guidance and code review from my senior, In-woo Park.'),
    t('Version 1: my first version, with basic HTML for the content and CSS to keep it clean.'),
    t('Version 1.1: a toggle so each section expands when clicked. This is where I first learned JavaScript.'),
    t('Version 2.0: a sidebar for navigation and a hidden dark mode that switches when you click the logo, which I added because I often coded at night.'),
    t('Version 2.5: I merged the separate HTML files into one, added hover pop-ups for extra detail, and hid an Easter egg: click "South Korea" and flags fall.'),
    t('Mobile 2.5: made for small screens, with the sidebar as a toggle pop-up and a side tab to open it.'),
    t('Deploying: I pushed the files to GitHub and GitHub Pages, and with the domain connected the site went live at henrykim.ca.'),
    t('Challenges: weak debugging skills, small unexpected errors, a lot of rewriting to keep the code simple, and studying features I had not learned yet.'),
    t('How I got past them: advice and code review from In-woo Park, quick help from ChatGPT, and coding tutorials plus steady practice.'),
    t('Skills gained: HTML, CSS, and JavaScript, better debugging and refactoring, interactive and responsive features, and GitHub and domain management.'),
    t('My biggest success: coding and publishing my own website from scratch. It gave me the confidence and the skills to start on MONO for real.'),
    t('What is next: develop MONO as a real AI platform. Design the Profit Score system, connect live market data, and automate the reselling.'),
    t('In conclusion: I built and published my site from scratch, got through real coding problems, and gained the skills to develop MONO.'),
    t('Thank you.'),
  ];
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; {t('All projects')}
      </Link>
      <Hero title="ÆRIOUS" subtitle={t('Like air, always close')} />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>{t('Ærious is the startup I am building, and its name is also my motto.')}</p>
            <p>
              {tx('Site: {link}', {
                link: (
                  <a href="https://aerious.co" target="_blank" rel="noopener noreferrer">
                    aerious.co
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="mono-logo" aria-hidden="true">
            <img className="mono-logo-dark" src="/media/aerious/aerious-mark-black.svg" alt="" width={920} height={713} />
            <img className="mono-logo-light" src="/media/aerious/aerious-mark-white.svg" alt="" width={920} height={713} />
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p className="story-head">{t('The name')}</p>
            <p>
              {t('It comes from the Latin aer, air. Add -ious, "full of" or "like", and you get "like air". People cannot live without air, but nobody thinks "I should breathe now" before taking a breath. I want what I make to be like that: everyone uses it, naturally, without thinking much about it. The line I picked for it is "Like air, always close."')}
            </p>
            <br />
            <p className="story-head">{t('The plan, so far')}</p>
            <p>
              {t('I first put the name and the plan into words in late August 2026. Ærious would start with AI tools that automate office work, some of its own and some built on contract for other companies. Later it would make programs and apps for everyday life, a supporter you need beside you. Part of why I made the brand is that I wanted to use my development experience more professionally.')}
            </p>
            <br />
            <p>
              {t("I have done office automation before. For about three months before Incheon Robotics I was a freelance engineer at Branphic, where I built 9+ internal automation tools that moved the company's day-to-day operations onto AI.")}
            </p>
            <br />
            <p>
              {t("So far there is the name, the site at aerious.co, first built at the end of August and rebuilt in September, and the Æ mark at the top of this page, set in Cormorant Garamond and kept to black and white. For the site's home page I came at the air idea through science: it scrolls through a molecule of ATP rendered in Blender, because breathing is how the body makes it.")}
            </p>
            <br />
            <p>{t('Before Ærious there was MONO, my first try at a startup, in 2025.')}</p>
            <br />
            <div id="mono" className="story-part">
              <h2>MONO</h2>
              <div className="mono-logo" aria-hidden="true">
                <img
                  className="mono-logo-dark"
                  src={`${MEDIA}/mono-logo.png`}
                  alt=""
                  width={900}
                  height={911}
                  loading="lazy"
                />
                <img
                  className="mono-logo-light"
                  src={`${MEDIA}/mono-logo-white.png`}
                  alt=""
                  width={900}
                  height={911}
                  loading="lazy"
                />
              </div>
              <div className="story-meta">
                <p>
                  {t('In an essay in January 2025 I wrote that I had long wanted to be an entrepreneur in a global marketplace. That May I started MONO, an AI resale-analytics platform, with me as its founder and CEO. It has not launched and is on hold.')}
                </p>
                <p>
                  {tx('Code: {link}', {
                    link: (
                      <a href="https://github.com/yxxjx-dsnv" target="_blank" rel="noopener noreferrer">
                        github.com/yxxjx-dsnv
                      </a>
                    ),
                  })}
                </p>
              </div>
              <p>
                {t('MONO is meant to watch resale and dropshipping markets, score each product for how much profit it can realistically make, and list and reprice the ones worth selling on a storefront by itself. The name means doing it in one step, close to one click.')}
              </p>
              <br />
              <p className="story-head">{t('Why I started it')}</p>
              <p>
                {t('I started reselling limited-edition items in high school, mostly on KREAM and Bunjang, and kept at it for about two years. It ate a lot of time. Every listing was manual and every price was a guess, and what I learned about one product never carried over to the next. MONO is the tool I wanted back then: something that does the repetitive part so that anyone, including people who are not technical, can find and sell profitable products without doing all of it by hand.')}
              </p>
              <br />
              <p className="story-head">{t('The Profit Score')}</p>
              <p>
                {t('MONO is designed around a number I call the Profit Score. For a given product it weighs the sourcing cost, shipping, platform fees, live demand, and what competitors are charging, then puts all of that on a single 0 to 100 scale. Products above a set threshold, around 85, would be listed automatically at a price the system recommends, set a little under the competition so they actually sell. The point is to take a call resellers usually make on instinct and make it repeatable.')}
              </p>
              <br />
              <p className="story-head">{t('Learning from people who had done it')}</p>
              <p>
                {tx('I did not want to build MONO from my own assumptions alone, so early on I talked to people who had built this kind of thing. The person I learned the most from was {name}, a senior of mine with real experience in AI development. He explained how these systems are actually put together, pushed on the parts of my plan that were thin, and gave me practical advice. Through him I also met a developer who had built an AI recommendation engine for pharmacists, and hearing how a working product like that was engineered showed me where automation runs into its limits.', {
                  name: (
                    <a href="https://www.linkedin.com/in/in-woopark/" target="_blank" rel="noopener noreferrer">
                      In-woo Park
                    </a>
                  ),
                })}
              </p>
              <br />
              <p className="story-head">{t('Taking it seriously')}</p>
              <p>
                {t("I also worked on the business side. I read up on Shopify's margins, dropshipping, demand prediction with tools like Google Trends, and how SaaS products make money, and I set up a Shopify store to test the listing flow end to end. In 2025 I applied to the Hana Social Venture University program, which backs socially useful startups. I passed the first round and completed the second interview.")}
              </p>
              <br />
              <figure className="story-figure">
                <Photo
                  src={`${MEDIA}/shopify.jpg`}
                  alt={t("A Shopify admin home screen for a store named 'One Shop One Kill', with a setup guide reading 'Get ready to sell' and a greeting 'Hi Henry'.")}
                  width={1253}
                  height={591}
                  loading="lazy"
                />
                <figcaption>{t("The Shopify store I set up to test MONO's listing flow.")}</figcaption>
              </figure>
              <p className="story-head">{t('The deck I presented')}</p>
              <p>
                {t('My capstone presentation was a pitch for MONO and the work behind it. The full deck is below, slide by slide.')}
              </p>
              <br />
              <PdfDeck src={`${MEDIA}/deck.pdf`} title={t('MONO capstone presentation')} captions={deckNotes} />
              <p className="story-head">{t('Where MONO stands')}</p>
              <p>
                {t('MONO is an idea for now: a Profit Score engine, live market data, and a storefront that lists and reprices on its own. If Ærious has a first product, I want it to be MONO.')}
              </p>
            </div>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
