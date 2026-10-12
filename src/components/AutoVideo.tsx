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
    // A pause the reader makes sticks until they press play again; only the
    // pause this effect makes on the way out of view is undone on the way back.
    // Chrome pauses muted video in a hidden tab itself, and that isn't the reader.
    let held = false;
    let selfPause = false;
    const onPause = () => {
      if (selfPause) selfPause = false;
      else if (!(document.hidden && v.muted)) held = true; // (a pause from the media keys in another tab is the reader's)
    };
    const onPlay = () => {
      held = false;
    };
    v.addEventListener('pause', onPause);
    v.addEventListener('play', onPlay);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            if (!held) void v.play().catch(() => {});
          } else if (!v.paused) {
            // pause() on a paused video fires no event, so only flag a real one
            selfPause = true;
            v.pause();
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.removeEventListener('pause', onPause);
      v.removeEventListener('play', onPlay);
    };
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
