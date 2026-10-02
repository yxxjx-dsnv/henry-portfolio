import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../i18n';
import type { BadgeState } from './badgeScene';
import { attachCoverResistance } from './coverResistance';

// The home page's cover: one full screen with the ID badge hanging over the
// name. Scroll down and the site begins; scroll back up and the badge is still
// swinging where you left it. The 3D loads after the page is idle, so it never
// holds up the first paint; until then (or without WebGL) the cover is just type.
export function BadgeCover() {
  const { t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coverRef = useRef<HTMLElement>(null);
  const bandRef = useRef<ReturnType<typeof attachCoverResistance>>();
  const [state, setState] = useState<BadgeState>('loading');

  useEffect(() => {
    const cover = coverRef.current;
    if (!cover) return;
    const band = attachCoverResistance(cover);
    bandRef.current = band;

    // First-timers don't know the site is below. While the cover sits untouched,
    // tug it toward the site a few times; the first scroll, touch or grab ends that.
    let tugs = 0;
    let timer: number | undefined;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const next = (ms: number) => {
      if (calm || tugs >= 3) return;
      timer = window.setTimeout(() => {
        if (window.scrollY < 2 && !document.hidden) {
          band.tease();
          tugs++;
        }
        next(6500);
      }, ms);
    };
    const stop = () => {
      tugs = 3;
      window.clearTimeout(timer);
    };
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach((n) => window.addEventListener(n, stop, { once: true, passive: true }));
    next(2500);

    // the phone's sidebar tab waits until the site itself is on screen
    const io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([e]) => document.body.classList.toggle('on-cover', e.intersectionRatio > 0.35), {
            threshold: [0, 0.35, 1],
          })
        : undefined;
    io?.observe(cover);

    // Desktop: the cover is edge to edge, the site is a centred column. So the
    // sidebar arrives from the screen's left edge and slides into its place as
    // the site rises into view, tied to the scroll (and so to the band's glide).
    const sidebar = document.querySelector<HTMLElement>('.sidebar');
    const wide = window.matchMedia?.('(min-width: 769px)');
    let frame = 0;
    const place = () => {
      frame = 0;
      if (!sidebar) return;
      if (!wide?.matches) {
        sidebar.style.transform = sidebar.style.opacity = sidebar.style.filter = sidebar.style.transition = '';
        return;
      }
      const vh = window.innerHeight;
      const t = Math.min(1, Math.max(0, (window.scrollY - (cover.offsetHeight - vh)) / vh));
      const eased = t * t * (3 - 2 * t); // lingers at the edge, then slides, then settles
      // offsetLeft ignores the transform, so it is always the sidebar's home
      sidebar.style.transform = eased < 1 ? `translateX(${-sidebar.offsetLeft * (1 - eased)}px)` : '';
      // and comes into focus on the way: faint and soft at the edge, solid a
      // little before it lands
      const f = Math.min(1, t / 0.85);
      const focus = f * f * (3 - 2 * f);
      sidebar.style.opacity = focus < 1 ? String(0.12 + 0.88 * focus) : '';
      // the essay page's reading-focus fade (a 450ms opacity transition) would
      // lag the scroll, so it is off while the scroll drives the sidebar
      sidebar.style.transition = focus < 1 ? 'none' : '';
      sidebar.style.filter = focus < 1 ? `blur(${(4 * (1 - focus)).toFixed(2)}px)` : '';
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      stop();
      events.forEach((n) => window.removeEventListener(n, stop));
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      if (sidebar) sidebar.style.transform = sidebar.style.opacity = sidebar.style.filter = sidebar.style.transition = '';
      io?.disconnect();
      document.body.classList.remove('on-cover');
      band.dispose();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let scene: { dispose(): void } | undefined;
    const start = () =>
      import('./badgeScene')
        .then(({ createBadgeScene }) => (cancelled || !canvasRef.current ? undefined : createBadgeScene(canvasRef.current, setState)))
        .then((s) => {
          if (cancelled) s?.dispose();
          else scene = s;
        })
        .catch((e) => {
          if (!cancelled) setState('error');
          console.error('Badge could not start:', e);
        });
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    let handle: number | undefined;
    const kick = () => (handle = idle(start, { timeout: 1500 }));
    const ready = () => (document.readyState === 'complete' ? kick() : window.addEventListener('load', kick, { once: true }));
    // Built only once the cover is actually on screen: coming back to Home lands
    // below it, and building the scene there would just stall the page you're reading.
    const cover = coverRef.current;
    const io =
      cover && typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([e]) => {
              // landing exactly below the cover still counts as "touching" (ratio 0)
              if (e.intersectionRatio <= 0) return;
              io?.disconnect();
              ready();
            },
            { threshold: 0.01 },
          )
        : undefined;
    if (io && cover) io.observe(cover);
    else ready();
    return () => {
      cancelled = true;
      io?.disconnect();
      window.removeEventListener('load', kick);
      if (handle !== undefined) cancelIdle(handle);
      scene?.dispose();
    };
  }, []);

  const toSite = () => bandRef.current?.toSite();

  return (
    <section ref={coverRef} className="badge-cover" aria-label={t('Introduction')}>
      <p className="badge-cover-intro">
        {t('I combine technology, design,')}{' '}
        <br />
        {t('and systems thinking.')}{' '}
        <button type="button" className="badge-cover-more" onClick={toSite}>
          [{t('more')}]
        </button>
      </p>
      <p className="badge-cover-edu">
        {t('Currently studying Electrical &')}{' '}
        <br />
        {t('Computer Engineering @ U of T')}
      </p>
      {/* decorative: the page's real heading is the "Henry Kim" just below the cover */}
      <p className="badge-cover-name" aria-hidden="true">
        <span>Henry</span> <span>Kim</span>
      </p>
      <canvas
        ref={canvasRef}
        className="badge-cover-canvas"
        data-state={state}
        aria-label={t("Henry Kim's ID badge. Drag it to swing it.")}
      />
    </section>
  );
}
