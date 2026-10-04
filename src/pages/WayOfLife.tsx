import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { useLang } from '../i18n';

export function WayOfLife() {
  const { t } = useLang();
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <Link to="/writing" className="story-back">
        &larr; All writing
      </Link>
      <Hero title="A way of life" subtitle="written: 2026/10/05" />
      <section className="essay-section">
        <div className="text">
          <div
            className="section-body poem"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            {/* set like a poem: one line per phrase, a stanza per thought */}
            <p>
              {t("In German, they don't say,")}
              <br />
              {t('"Spend your time wisely,"')}
            </p>
            <p>
              {t('they say,')}
              <br />
              {t('"if you chase butterflies, they fly away."')}
            </p>
            <p>
              {t('But if you create beautiful garden,')}
              <br />
              {t('the butterflies will come.')}
            </p>
            <p>
              {t("And if they don't,")}
              <br />
              {t('you still have a beautiful garden.')}
            </p>
            <p>{t('So I will tend a beautiful garden of my own.')}</p>
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
