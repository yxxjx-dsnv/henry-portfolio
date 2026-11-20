import { useEffect, useRef, useState } from 'react';
import { useNearView } from '../hooks/useNearView';

// The butterfly under "A way of life": a real Blue Mountain Swallowtail (Papilio ulysses),
// a rigged 3D model lit and rendered in Blender (tools/butterfly/render_model.py) as a seamless
// 3.2 s loop with a transparent background, so it sits on the light page and the dark one
// alike. Safari plays the HEVC-with-alpha file, the others the VP9 WebM. It loads only as
// the reader nears the end of the poem, plays only while on screen, and holds still for
// anyone who asks for less motion.

const M = '/media/butterfly/';

export function Butterfly() {
  const figRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const near = useNearView(figRef, 600);
  const [calm] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true; // the attribute React leaves off; autoplay needs it
    // play() returns a promise in browsers today, nothing in older ones (and jsdom): hence ?.
    if (typeof IntersectionObserver !== 'function') {
      video.play()?.catch(() => {});
      return;
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? video.play()?.catch(() => {}) : video.pause()));
    io.observe(video);
    return () => io.disconnect();
  }, [near]);

  return (
    <figure ref={figRef} className="butterfly" aria-hidden="true">
      {near && !calm ? (
        <video ref={videoRef} loop playsInline muted preload="auto" poster={`${M}poster.webp`} disablePictureInPicture>
          <source src={`${M}butterfly.mov`} type='video/quicktime; codecs="hvc1"' />
          <source src={`${M}butterfly.webm`} type="video/webm" />
        </video>
      ) : (
        <img src={`${M}poster.webp`} alt="" width={1728} height={1440} loading="lazy" />
      )}
    </figure>
  );
}
