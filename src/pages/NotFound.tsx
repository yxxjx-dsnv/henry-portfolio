import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { LostDot } from '../components/LostDot';
import { useLang } from '../i18n';

export function NotFound() {
  const { t, tx } = useLang();
  return (
    <section className="section">
      <Hero title="404" subtitle="this page does not exist" />
      <section className="about-section">
        <div className="text">
          <p className="notfound-line">{tx('Nothing lives here. {home}.', { home: <Link to="/">{t('Return home')}</Link> })}</p>
          <LostDot />
        </div>
      </section>
    </section>
  );
}
