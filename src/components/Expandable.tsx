import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { HOLD_MS, SLOP } from '../hooks/useDragSwipe';

// "Expand" for the things on the site that do something (a simulation, the C runner, a
// deck): the frame leaves its place in the text and grows to most of the window, over a
// dimmed, blurred page — bigger, not full screen. It is the same element moved, not a
// copy mounted elsewhere, so a running simulation, an edited program or the slide being
// read carries on untouched. A placeholder holds its place in the article meanwhile.
// Closes with its button, Escape, or a click on the page behind. A photo, a carousel or a deck
// also opens and closes with a long press on its picture.

const GROW_MS = 280;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

type Rect = { left: number; top: number; width: number; height: number };
type Chrome = [number, number];
const NONE: Chrome = [0, 0];
/** Padding and caption room, fixed or by window width (a phone's layout differs). */
type ChromeOf = Chrome | ((vw: number) => Chrome);

/** The frame's size when expanded: all of the window but a margin of the page around it.
 *  With an `aspect` (a picture's width / height) it takes the picture's shape instead, plus
 *  `chrome` px [across, down] for padding and a caption row, so no empty band is left
 *  beside or below it. */
function target(aspect?: number, chrome: ChromeOf = NONE) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const [cx, cy] = typeof chrome === 'function' ? chrome(vw) : chrome;
  const inset = vw <= 640 ? 12 : 24; // phones: nearly all of it
  let width = Math.min(vw - 2 * inset, 1800);
  let height = vh - 2 * inset;
  if (aspect) {
    height = Math.min(height, (width - cx) / aspect + cy);
    width = Math.min(width, (height - cy) * aspect + cx);
  }
  return { width, height }; // centred by CSS (inset 0, margin auto): the fixed layer starts after any scrollbar gutter
}

/** After a hold opened or closed a frame, the click that ends the press is not a tap, wherever it
 *  lands: the frame has grown under the finger (onto the backdrop) or shrunk away from it (onto
 *  a link or another photo). The next press, or half a second after this one ends, lifts it
 *  (Android sends no click after a long press). */
function swallowNextClick() {
  const swallow = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    drop();
  };
  const drop = () => {
    document.removeEventListener('click', swallow, true);
    window.removeEventListener('pointerdown', drop, true);
  };
  document.addEventListener('click', swallow, true);
  window.addEventListener('pointerdown', drop, true);
  window.addEventListener('pointerup', () => window.setTimeout(drop, 500), { once: true, capture: true });
}

const reduced = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animate `el` from rect `a` to where it is now (a FLIP: first, last, invert, play). */
function grow(el: HTMLElement, a: DOMRect | Rect, b: DOMRect | Rect, reverse = false) {
  if (reduced() || typeof el.animate !== 'function' || !b.width || !b.height) return Promise.resolve();
  const invert = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  const still = { transform: 'none', transformOrigin: '0 0' };
  const moved = { transform: invert, transformOrigin: '0 0' };
  return el
    .animate(reverse ? [still, moved] : [moved, still], { duration: GROW_MS, easing: EASE })
    .finished.then(
      () => {},
      () => {},
    );
}

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
  aspect?: number; // a picture: the frame takes its shape (see target)
  chrome?: ChromeOf; // a function must be stable (module scope)
  tapToOpen?: boolean; // a click anywhere on it opens and closes it, not only the button
  holdToOpen?: boolean; // a long press on its picture opens and closes it; the button then shows only to a keyboard
};

export function Expandable({ label, children, className = '', aspect, chrome = NONE, tapToOpen = false, holdToOpen = false }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ width: number; height: number } | null>(null);
  const [slotH, setSlotH] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const from = useRef<DOMRect | null>(null);
  const closing = useRef(false);
  const hold = useRef<{ id: number; x: number; y: number; timer: number } | null>(null);
  const pointer = useRef(''); // the kind of pointer that pressed last

  const expand = () => {
    const el = box.current;
    if (!el || open) return;
    from.current = el.getBoundingClientRect();
    setSlotH(from.current.height);
    setRect(target(aspect, chrome));
    setOpen(true);
  };

  // `refocus`: a keyboard close hands focus back to the button; a pointer close leaves it (the
  // button would come back into sight focused, on a picture whose button is meant to stay away)
  const close = useCallback((refocus = true) => {
    const el = box.current;
    if (!el || !open || closing.current) return;
    closing.current = true;
    const slot = el.parentElement!.getBoundingClientRect();
    const back = { left: slot.left, top: slot.top, width: slot.width, height: slotH || slot.height };
    grow(el, back, el.getBoundingClientRect(), true).then(() => {
      closing.current = false;
      setOpen(false);
      setRect(null);
      if (refocus) toggle.current?.focus({ preventScroll: true });
    });
  }, [open, slotH]);

  // grown into place from where it sat in the text; focus moves inside
  useLayoutEffect(() => {
    const el = box.current;
    if (!open || !el || !from.current) return;
    void grow(el, from.current, el.getBoundingClientRect());
    from.current = null;
    el.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.defaultPrevented) {
        // focus stays in the open frame (the C editor's own Tab has already been taken)
        const el = box.current;
        if (!el) return;
        const focusable = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        const shown = focusable.filter((n) => n.getClientRects().length > 0); // laid out (none at all: no layout, as in tests)
        const all = shown.length ? shown : focusable;
        const first = all[0];
        const last = all[all.length - 1];
        const at = document.activeElement;
        if (!first) return;
        if (e.shiftKey && (at === first || at === el)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (at === last || !el.contains(at))) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const t = e.target as HTMLInputElement | null;
      // an Escape in a text field is the field's (the C editor uses Escape, then Tab, to leave);
      // a slider, a checkbox or a read-only file has no use for it
      const typing =
        t && (t.isContentEditable || ((t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && !/^(range|checkbox|radio|button|submit|reset|color)$/.test(t.type))) && !t.readOnly));
      if (typing) return;
      close();
    };
    const onResize = () => setRect(target(aspect, chrome));
    // the page behind stays where it is while the frame is open (html keeps its scrollbar
    // gutter, scrollbar-gutter: stable, so nothing shifts sideways)
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    document.body.classList.add('xp-open');
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      html.style.overflow = prev;
      document.body.classList.remove('xp-open');
    };
  }, [open, close, aspect, chrome]);

  const endHold = () => {
    if (!hold.current) return;
    window.clearTimeout(hold.current.timer);
    hold.current = null;
    box.current?.classList.remove('is-holding');
  };
  useEffect(() => () => window.clearTimeout(hold.current?.timer), []);

  const holdProps = holdToOpen
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          pointer.current = e.pointerType;
          endHold();
          // a Mac's Ctrl+click opens the context menu, which swallows the release
          if (e.button !== 0 || e.ctrlKey || !(e.target as Element).closest('img, canvas')) return;
          box.current?.classList.add('is-holding');
          const timer = window.setTimeout(() => {
            endHold();
            swallowNextClick();
            if (open) close(false);
            else expand();
          }, HOLD_MS);
          hold.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer };
        },
        // moving is a swipe or a scroll, not a hold (a finger drifts a little more than a mouse)
        onPointerMove: (e: React.PointerEvent) => {
          const h = hold.current;
          if (h && e.pointerId === h.id && Math.hypot(e.clientX - h.x, e.clientY - h.y) > (e.pointerType === 'mouse' ? SLOP : 10)) endHold();
        },
        onPointerUp: endHold,
        onPointerCancel: endHold,
        // a finger's long press on the picture is ours, not the browser's image menu (a mouse keeps
        // its right click; links, captions and video controls keep theirs)
        onContextMenu: (e: React.MouseEvent) => {
          if (pointer.current !== 'mouse' && (e.target as Element).closest('img, canvas')) e.preventDefault();
        },
        onDragStart: (e: React.DragEvent) => {
          if ((e.target as Element).closest('img, canvas')) e.preventDefault();
        },
      }
    : {};

  return (
    <div className={`xp-slot${open ? ' is-open' : ''}`} style={open ? { height: slotH } : undefined}>
      {open && <div className="xp-backdrop" onClick={() => close(false)} aria-hidden="true" />}
      <div
        ref={box}
        className={`xp ${className}${tapToOpen ? ' xp-tap' : ''}${holdToOpen ? ' xp-hold' : ''}${open ? ' is-open' : ''}`}
        style={open && rect ? { width: rect.width, height: rect.height } : undefined}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label={open ? label : undefined}
        tabIndex={open ? -1 : undefined}
        {...holdProps}
        onClick={
          tapToOpen
            ? (e) => {
                if ((e.target as Element).closest('.xp-toggle')) return;
                if (open) close(false);
                else expand();
              }
            : undefined
        }
      >
        <button
          ref={toggle}
          type="button"
          className="xp-toggle"
          aria-label={open ? `Close ${label}` : `Expand ${label}`}
          aria-expanded={open}
          title={open ? 'Close (Esc)' : 'Expand'}
          onClick={open ? () => close() : expand}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            {open ? (
              <path d="M4 4l8 8M12 4l-8 8" />
            ) : (
              <path d="M9.5 2.5h4v4M13.5 2.5l-4.5 4.5M6.5 13.5h-4v-4M2.5 13.5l4.5-4.5" />
            )}
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

/** A single photo in a story: a click or a long press on it shows it as large as the window
 *  allows, in its own shape. */
export function Photo(props: ImgHTMLAttributes<HTMLImageElement> & { width: number; height: number }) {
  return (
    <Expandable label={props.alt || 'photo'} className="xp-photo" aspect={props.width / props.height} tapToOpen holdToOpen>
      <img loading="lazy" {...props} />
    </Expandable>
  );
}
