import { useId, useRef, useState } from 'react';

// Disclosure semantics for a timeline row (BUG-3): the row is announced as an
// expandable control whose aria-expanded tracks whether it is pinned open — by a
// click, a tap, or Enter/Space. On a mouse, hovering also previews the details
// (CSS); a click that closes a row shuts that preview too until the pointer
// leaves, so the row visibly closes under the cursor. Focus alone no longer
// holds a row open: a clicked row keeps focus, and it could never be closed.
export function useDisclosureRow(hasDetail: boolean) {
  const detailId = useId();
  const [pinned, setPinned] = useState(false);
  const [shut, setShut] = useState(false);
  const pointer = useRef(''); // the kind of pointer that pressed last

  if (!hasDetail) {
    return { rowProps: {}, detailId: undefined, open: false, pinned: false, shut: false };
  }

  // `byMouse`: a mouse close also shuts the hover preview under the cursor; a key
  // or a finger has no hover to shut (and a stuck shut would hide the next one)
  const toggle = (byMouse: boolean) => {
    setShut(pinned && byMouse);
    setPinned(!pinned);
  };

  const rowProps = {
    tabIndex: 0,
    role: 'button' as const,
    'aria-expanded': pinned,
    'aria-controls': detailId,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => (pointer.current = e.pointerType),
    onPointerEnter: () => setShut(false),
    onPointerLeave: () => setShut(false),
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPinned(false);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
        e.preventDefault();
        toggle(false);
      }
    },
    // Tap/click toggles — iOS Safari never focuses a tabIndex div on tap, so
    // without this the details were unreachable on mobile. Links inside the row
    // keep working normally.
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('a')) return;
      // the click that ends a text selection (a drag, a double-click) is not a toggle
      if (e.detail > 1 || !(window.getSelection()?.isCollapsed ?? true)) return;
      toggle(pointer.current === 'mouse');
    },
  };
  return { rowProps, detailId, open: pinned, pinned, shut };
}
