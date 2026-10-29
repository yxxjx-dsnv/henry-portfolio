import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { useLang } from '../i18n';

export function MoonAndBack() {
  const { t } = useLang();
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <Link to="/writing" className="story-back">
        &larr; All writing
      </Link>
      <Hero title="To the moon and back" subtitle="written: 2026/10/29" />
      <section className="essay-section">
        <div className="text">
          <div
            className="section-body poem"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>{t('"I love you to the moon and back" means I love you as far as the moon and back again.')}</p>
            <p>{t("They say the work a person's heart does in a lifetime is enough to drive a car from the Earth to the moon and back.")}</p>
            <p>{t('On October 23, I finally found the one who will travel with me to the moon.')}</p>
            <p>
              {t(
                'She is beautiful and so precious to me: over the past year she taught me what true love is, and how beautiful a feeling it is to like someone like crazy.',
              )}
            </p>
            <p>{t('I never want to let her go.')}</p>
            <p>
              {t(
                'I want to spend my whole life with her: seeing the far side of the moon at its most beautiful hour, circling it slowly, looking back together on the journey we have made, and returning to the place where it all began.',
              )}
            </p>
            <p>{t('Ella, I love you to the moon and back.')}</p>
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
