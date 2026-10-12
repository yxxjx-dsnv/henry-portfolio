/**
 * Whether `el` is on screen (or within a little of it) and its tab is showing — for a render
 * loop to skip the frames nobody sees. Without IntersectionObserver it reports on screen.
 */
export function onScreen(el: Element): { readonly on: boolean; stop: () => void } {
  let inView = true;
  const state = {
    get on() {
      return inView && !document.hidden;
    },
    stop: () => {},
  };
  if (typeof IntersectionObserver !== 'function') return state;
  const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting), { rootMargin: '100px' });
  io.observe(el);
  state.stop = () => io.disconnect();
  return state;
}
