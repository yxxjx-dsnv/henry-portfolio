import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { LostDot } from '../components/LostDot';

export function NotFound() {
  return (
    <section className="section">
      <Hero title="404" subtitle="this page does not exist" />
      <section className="about-section">
        <div className="text">
          <p className="notfound-line">
            Nothing lives here. <Link to="/">Return home</Link>.
          </p>
          <LostDot />
        </div>
      </section>
    </section>
  );
}
