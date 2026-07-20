import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ReadProgress } from '../components/ReadProgress';
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
    caption: "The ROM's Gallery of Korea — the cause the donation supports.",
    width: 800,
    height: 463,
  },
];

export function Utkesa() {
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
            <p>
              UTKESA, the University of Toronto Korean Engineering Students' Association, connects
              Korean engineering students through academic support, professional development, and
              social events. I joined the Event Department as an intern in September 2025 and became
              an executive in January 2026, helping plan and run the association's events. The one I
              care about most was a donation the association made to a museum campaign.
            </p>
            <br />
            <p className="story-head">The gallery at risk</p>
            <p>
              The Royal Ontario Museum holds Canada's only permanent Gallery of Korea, and it was
              at risk. Without a dedicated curator, the gallery faced the possibility of closure or
              being folded into a broader East Asian gallery, which would blur the specific history
              it exists to tell. The Korea Root Initiative started a campaign to fund a permanent
              curator, and UTKESA chose to stand behind it.
            </p>
            <br />
            <p>
              The timing was deliberate. The association made its donation around Samil-jeol, the
              March 1st holiday that commemorates the 1919 Korean independence movement. For a
              group of Korean students studying abroad, donating around that day was our way of
              marking it. The funds had been raised across the year by the executive team, and the
              contribution went to the Korea Root Initiative in support of the curator campaign for
              the Gallery of Korea.
            </p>
            <br />
            <p className="story-head">The event</p>
            <p>
              The Korea Root Initiative later hosted a gathering where community leaders,
              organizations, and student groups came together for the cause, and that is where the
              contribution was handed over in person and recognized. UTKESA attended to show its
              support, with our 43rd president Jihan Kang and 44th president Leo Choung representing
              the association. As part of the event team, I helped with the work behind it. The
              photos below are from that day, at the fundraiser and at the gallery itself.
            </p>
            <br />
            <FigureCarousel slides={EVENT} label="The Korea Root Initiative event and the Gallery of Korea" />
            <p className="story-head">The certificate</p>
            <p>
              The Korea Root Initiative recognized the contribution with a certificate: CAD $400
              from the Korean Engineering Students' Association at the University of Toronto, toward
              establishing a permanent curator for the Gallery of Korea at the ROM. It is a small
              amount against what a curator costs, but it is real and on the record, and it went to
              a specific gallery.
            </p>
            <br />
            <figure className="story-figure">
              <img
                src={`${MEDIA}/cert.jpg`}
                alt="The Korea Root Initiative Certification of Contribution: presented to the Korean Engineering Students' Association at the University of Toronto for a CAD $400 contribution toward establishing a permanent curator for the Gallery of Korea at the Royal Ontario Museum, dated May 10, 2026."
                width={1200}
                height={1600}
                loading="lazy"
              />
              <figcaption>The certificate of contribution — CAD $400, dated May 10, 2026.</figcaption>
            </figure>
            <p className="story-head">What I took from it</p>
            <p>
              Most of what a student association does is logistics: rooms, sign-ups, schedules. This
              was the part that reminded me why the logistics are worth doing. A club lets a group
              put a bit of money and effort toward something it decides matters, and for us that was
              the Gallery of Korea. The money came from events the executive team ran all year,
              which is a large part of why the logistics matter to me.
            </p>
            <br />
            <div className="end-mark" aria-hidden="true" />
          </div>
        </div>
      </section>
    </section>
  );
}
