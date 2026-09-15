import { Hero } from '../components/Hero';
import { useLang } from '../i18n';

const rescued = () => {
  try {
    return localStorage.getItem('lost-dot-rescued') === '1';
  } catch {
    return false;
  }
};

// The last page of a well-made book: what the site is set in, what built it,
// and a printer's mark proving it is hand-made and version-controlled.
export function Colophon() {
  const { t, tx } = useLang();
  return (
    <section className="section">
      <Hero title="Colophon" subtitle="how this site is made" />
      <section className="about-section">
        <div className="text colophon-text">
          <p className="colophon-line">
            {tx('Set in {font}, black on white, and white on black after dark.', {
              font: (
                <a href="https://fonts.google.com/specimen/Libre+Baskerville" target="_blank" rel="noopener noreferrer">
                  Libre Baskerville
                </a>
              ),
            })}
          </p>
          <p className="colophon-line">
            {t('Built by hand with React, TypeScript, and Vite. Plain CSS, no UI libraries. Hosted on GitHub Pages at henrykim.ca.')}
          </p>
          <p className="colophon-line">{t('Pages answer to the keys 1 to 5. ⌘K (Ctrl+K elsewhere) opens the switchboard.')}</p>
          {rescued() && (
            <p className="colophon-line colophon-rescued">
              {t('A dot once got lost on the 404 page. Someone caught it. It lives here now.')}
            </p>
          )}
          <p className="colophon-mark">
            build {__BUILD_DATE__} · {__COMMIT_HASH__}
          </p>
          <div className="end-mark" aria-hidden="true" />
        </div>
      </section>
    </section>
  );
}
