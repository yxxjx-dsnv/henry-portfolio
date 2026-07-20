import { useEffect, useRef } from 'react';

// A video that starts itself when it scrolls into view and pauses when it
// leaves — muted so the browser allows autoplay, looping so a short clip keeps
// going while you look at it. Controls stay, so it can be paused or unmuted by
// hand. Reduced-motion visitors get a normal click-to-play video, nothing auto.
export function AutoVideo({
  src,
  width,
  height,
  alt,
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            void v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      controls
      playsInline
      preload="metadata"
      width={width}
      height={height}
      aria-label={alt}
    />
  );
}
