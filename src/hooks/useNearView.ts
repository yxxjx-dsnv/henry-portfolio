import { useEffect, useState, type RefObject } from 'react';

/** True once `ref`'s element comes within `margin` of the screen, and from then on: a heavy thing
 *  (a PDF) waits for the reader to get near it. Without IntersectionObserver it is near at once. */
export function useNearView(ref: RefObject<Element>, margin = 800): boolean {
  const [near, setNear] = useState(() => typeof IntersectionObserver !== 'function');
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: `${margin}px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, ref, margin]);
  return near;
}
