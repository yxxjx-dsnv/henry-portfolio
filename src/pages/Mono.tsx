import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { PdfDeck } from '../components/PdfDeck';
import { useLang } from '../i18n';

const MEDIA = '/media/mono';

export function Mono() {
  const { t, tx } = useLang();
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  const deckNotes = [
    t('Title: how my Capstone turned into learning to code, building a website, and preparing my AI startup, MONO.'),
    t('The original goal: build MONO, a startup that uses automation and AI to run a profitable, scalable reselling platform. To get there I needed web development, programming, and AI basics.'),
    t('Why this question: I had real experience reselling limited products online. It was manual and slow, so I wanted an AI system to make it easier and more profitable for anyone.'),
    t('What MONO is: an AI smart-commerce platform that finds profitable products, scores them on cost, fees, demand, and competitors, auto-lists the best ones, and adjusts prices to stay competitive. The name means doing it in one step.'),
    t('To build MONO’s AI I first had to understand how AI works and improve my programming, so I started with the fundamentals.'),
    t('The pivot: without coding I could not build MONO, so I decided to build my personal portfolio website first, to practice.'),
    t('What the site needed: a domain and hosting. I learned HTML for structure, CSS for styling, and JavaScript for interactivity, with ChatGPT for questions and GitHub for version control.'),
    t('I bought henrykim.ca on GoDaddy and used DNS settings to connect it to GitHub Pages for free hosting.'),
    t('Proof it is live: the domain receipt, the DNS settings, and the GitHub Pages link.'),
    t('Coding the site from scratch in VS Code, with guidance and code review from my senior, In-woo Park.'),
    t('Version 1: my first version, with basic HTML for the content and CSS to keep it clean.'),
    t('Version 1.1: a toggle so each section expands when clicked. This is where I first learned JavaScript.'),
    t('Version 2.0: a sidebar for navigation and a hidden dark mode that switches when you click the logo, which I added because I often coded at night.'),
    t('Version 2.5: I merged the separate HTML files into one, added hover pop-ups for extra detail, and hid an Easter egg — click “South Korea” and flags fall.'),
    t('Mobile 2.5: fully optimized for small screens, with the sidebar as a toggle pop-up and a side tab to open it.'),
    t('Deploying: I pushed the files to GitHub and GitHub Pages, and with the domain connected the site went live at henrykim.ca.'),
    t('Challenges: weak debugging skills, small unexpected errors, a lot of rewriting to keep the code simple, and studying features I had not learned yet.'),
    t('How I got past them: advice and code review from In-woo Park, quick help from ChatGPT, and coding tutorials plus steady practice.'),
    t('Skills gained: HTML, CSS, and JavaScript, better debugging and refactoring, interactive and responsive features, GitHub and domain management, and a stronger mindset for harder programming.'),
    t('My biggest success: coding and publishing my own website from scratch, which gave me the confidence and skills to build MONO for real.'),
    t('What is next: develop MONO as a real AI platform — design the profit-score system, connect live market data, and automate the reselling.'),
    t('In conclusion: I built and published my site from scratch, overcame real coding challenges, and gained the skills to develop MONO. A strong first step toward the startup.'),
    t('Thank you.'),
  ];
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/projects" className="story-back">
        &larr; {t('All projects')}
      </Link>
      <Hero title="MONO" subtitle={t('Resale analytics platform · Founder & CEO')} />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>{t('An AI resale-analytics platform I am building. I am its founder and CEO.')}</p>
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
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>
              {t('MONO is a resale-analytics platform I am building, and I am its founder. It watches resale and dropshipping markets, scores every product for how much profit it can realistically turn, and lists and reprices the ones worth selling on a storefront by itself. The name is the whole idea in one word: doing it in one step, close to one click.')}
            </p>
            <br />
            <p className="story-head">{t('Why I started it')}</p>
            <p>
              {t('I started reselling limited-edition items on platforms like StockX in high school, and for about two years it returned somewhere around 30 to 40 percent a year. It also ate a lot of time. Every listing was manual, every price was a guess, and the research never carried over from one product to the next. MONO is the tool I wanted back then: something that does the boring, repeatable part so that anyone, including people who are not technical, can find and sell profitable products without living inside spreadsheets.')}
            </p>
            <br />
            <p className="story-head">{t('The Profit Score')}</p>
            <p>
              {t('The core of MONO is a number I call the Profit Score. For a given product it weighs the sourcing cost, shipping, platform fees, live demand, and what competitors are charging, then puts all of that on a single 0 to 100 scale. Products above a set threshold, around 85, get listed automatically at a price the system recommends, set a little under the competition so they actually sell. The idea is to take a call resellers usually make on instinct and make it repeatable.')}
            </p>
            <br />
            <p className="story-head">{t('Learning from people who had done it')}</p>
            <p>
              {tx('I did not want to build MONO from my own assumptions alone, so I spent much of the early months in conversation. The person I learned the most from was {name}, a senior of mine with real experience in AI development. He walked me through how these systems are actually put together, pushed on the parts of my plan that were thin, and gave me practical advice instead of encouragement. Through him I also met a developer who had built an AI recommendation engine for pharmacists, and hearing how a working product like that was really engineered taught me more about the constraints of automation than any article had. Those conversations are a large part of how MONO went from a hunch to something I could reason about.', {
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
              {t("Alongside the research I tried to move it forward as a real venture. I read into Shopify's margins, dropshipping, demand prediction with tools like Google Trends, and how SaaS products make money, and I set up a working Shopify store to test the listing flow end to end. In 2025 I applied to the Hana Social Venture University program, which backs socially useful startups; I passed the first round and completed the second interview.")}
            </p>
            <br />
            <figure className="story-figure">
              <img
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
              {t('I pitched MONO, and the work behind it, as my capstone presentation. Here is the full deck, slide by slide.')}
            </p>
            <br />
            <PdfDeck src={`${MEDIA}/deck.pdf`} title={t('MONO capstone presentation')} captions={deckNotes} />
            <p className="story-head">{t('Where it goes next')}</p>
            <p>
              {t('MONO has not launched yet. The next steps are the technical ones: build the Profit Score engine, connect it to live market data, and let it list and reprice on its own. I have been teaching myself the software side to get there, and if the Hana program comes through I will develop MONO with their support.')}
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
