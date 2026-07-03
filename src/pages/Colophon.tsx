import { Hero } from '../components/Hero';

// The last page of a well-made book: what the site is set in, what built it,
// and a printer's mark proving it is hand-made and version-controlled.
export function Colophon() {
  return (
    <section className="section">
      <Hero title="Colophon" subtitle="how this site is made" />
      <section className="about-section">
        <div className="text colophon-text">
          <p className="colophon-line">
            Set in{' '}
            <a href="https://fonts.google.com/specimen/Libre+Baskerville" target="_blank" rel="noopener noreferrer">
              Libre Baskerville
            </a>
            , black on white — and white on black after dark.
          </p>
          <p className="colophon-line">
            Built by hand with React, TypeScript, and Vite. Plain CSS, no UI libraries. Hosted on
            GitHub Pages at henrykim.ca.
          </p>
          <p className="colophon-line">Pages answer to the keys 1–5. ⌘K opens the switchboard.</p>
          <p className="colophon-mark">
            build {__BUILD_DATE__} · {__COMMIT_HASH__}
          </p>
          <div className="end-mark" aria-hidden="true" />
        </div>
      </section>
    </section>
  );
}
