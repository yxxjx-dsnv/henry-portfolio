import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { writing } from '../data/writing';
import { useLang } from '../i18n';

// '2026/10/05' -> 'October 5, 2026'
const longDate = (d: string) => {
  const [y, m, day] = d.split('/').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export function Writing() {
  const { t } = useLang();
  return (
    <section className="section">
      <Hero title="Writing" subtitle={`last updated: ${writing[0].date}`} />
      <ul className="writing-list">
        {writing.map((w) => (
          <li key={w.slug}>
            <Link to={`/writing/${w.slug}`}>{t(w.title)}</Link>
            <p>{longDate(w.date)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
