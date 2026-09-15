import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
import { useLang } from '../i18n';
import { FigureCarousel, type CarouselSlide } from '../components/FigureCarousel';

const MEDIA = '/media/utkesa';

const EVENT: CarouselSlide[] = [
  {
    src: `${MEDIA}/speaker.jpg`,
    alt: 'A speaker in hanbok addresses the room with a microphone in front of a large Korean flag at the Korea Root Initiative fundraising event.',
    caption: 'The Korea Root Initiative fundraiser.',
    width: 800,
    height: 622,
  },
  {
    src: `${MEDIA}/handover.jpg`,
    alt: 'A student hands a donation envelope to an organizer in front of a Korean flag, others watching and filming.',
    caption: 'Handing over the contribution.',
    width: 800,
    height: 600,
  },
  {
    src: `${MEDIA}/reps.jpg`,
    alt: 'Four UTKESA representatives stand with the Korea Root Initiative organizer, two of them holding framed certificates of contribution.',
    caption: 'UTKESA representatives with the certificates.',
    width: 960,
    height: 540,
  },
  {
    src: `${MEDIA}/flag.jpg`,
    alt: 'Hands signing messages in marker across a large Korean flag laid on a table.',
    caption: 'Signing the flag at the event.',
    width: 960,
    height: 540,
  },
  {
    src: `${MEDIA}/gallery.jpg`,
    alt: "The Royal Ontario Museum's Gallery of Korea: glass cases of Korean drums, instruments, and artifacts, visitors walking through.",
    caption: "The ROM's Gallery of Korea, which the donation supports.",
    width: 800,
    height: 463,
  },
];

export function Utkesa() {
  const { t } = useLang();
  const slides = EVENT.map((s) => ({ ...s, alt: t(s.alt), caption: t(s.caption) }));
  useEffect(() => () => document.body.classList.remove('reading-focus'), []);
  return (
    <section className="section">
      <ReadProgress />
      <Link to="/extra-curricular" className="story-back">
        &larr; All activities
      </Link>
      <Hero title="UTKESA & the Gallery of Korea" subtitle="Event Department · Korea Root Initiative donation" />
      <section className="essay-section">
        <div className="text">
          <div className="story-meta">
            <p>
              Event Department Executive at{' '}
              <a href="https://www.instagram.com/utkesa_official/" target="_blank" rel="noopener noreferrer">
                UTKESA
              </a>
              , the U of T Korean Engineering Students' Association
            </p>
            <p>
              Proof:{' '}
              <a
                href="https://www.linkedin.com/posts/utkesa_samiljeol-koreanhistory-koreanculture-activity-7442208647981486080-e4rZ"
                target="_blank"
                rel="noopener noreferrer"
              >
                the donation
              </a>
              {' · '}
              <a
                href="https://www.linkedin.com/posts/utkesa_as-utkesa-we-are-deeply-honored-to-support-activity-7479866786486722560-SkUq"
                target="_blank"
                rel="noopener noreferrer"
              >
                the event
              </a>
            </p>
          </div>
          <div
            className="section-body"
            onPointerEnter={() => document.body.classList.add('reading-focus')}
            onPointerLeave={() => document.body.classList.remove('reading-focus')}
          >
            <p>{t("UTKESA, the University of Toronto Korean Engineering Students' Association, connects Korean engineering students through academic support, professional development, and social events. I joined the Event Department as an intern in September 2025 and became an executive in January 2026, helping plan and run the association's events. What I care about most from that time is a donation the association made to a museum campaign.")}</p>
            <br />
            <p className="story-head">The gallery at risk</p>
            <p>{t("The Royal Ontario Museum has Canada's only permanent Gallery of Korea. Without a dedicated curator it could have closed or been folded into a broader East Asian gallery, and the specific history it is there to tell would have blurred into that. The Korea Root Initiative started a campaign to fund a permanent curator, and UTKESA decided to support it.")}</p>
            <br />
            <p>{t("We made the donation around Samil-jeol, the March 1st holiday that commemorates the 1919 Korean independence movement, on purpose. For Korean students studying abroad it was our way of marking the day. The money had been raised over the year by the executive team.")}</p>
            <br />
            <p className="story-head">The event</p>
            <p>{t("The Korea Root Initiative later held a fundraiser where community leaders, organizations, and student groups gathered for the cause, and the contribution was handed over there in person. Our 43rd president Jihan Kang and 44th president Leo Choung represented UTKESA. I helped with the work behind our part of it as a member of the event team. The photos below are from that day, at the fundraiser and at the gallery itself.")}</p>
            <br />
            <FigureCarousel slides={slides} label={t('The Korea Root Initiative event and the Gallery of Korea')} />
            <p className="story-head">The certificate</p>
            <p>{t("The Korea Root Initiative recognized the contribution with a certificate: CAD $400 from the Korean Engineering Students' Association at the University of Toronto, toward a permanent curator for the Gallery of Korea at the ROM. It is a small amount next to what a curator costs, but it is on the record and it went to one specific gallery.")}</p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/cert.jpg`}
                alt={t("The Korea Root Initiative Certification of Contribution: presented to the Korean Engineering Students' Association at the University of Toronto for a CAD $400 contribution toward establishing a permanent curator for the Gallery of Korea at the Royal Ontario Museum, dated May 10, 2026.")}
                width={1200}
                height={1600}
                loading="lazy"
              />
              <figcaption>{t("The certificate: CAD $400, dated May 10, 2026.")}</figcaption>
            </figure>
            <p className="story-head">What I took from it</p>
            <p>{t("Most of what a student association does is logistics: rooms, sign-ups, schedules. A club also lets a group put a bit of money and effort toward something it decides matters, and for us that was the Gallery of Korea. That money came from the events the executive team ran all year, which is reason enough for the logistics.")}</p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
