import { useId, useState } from 'react';

// Disclosure semantics for a timeline row (BUG-3): the row is announced as an
// expandable control whose aria-expanded tracks the real open state — open on
// hover/focus (matching the CSS) or pinned open with Enter/Space.
export function useDisclosureRow(hasDetail: boolean) {
  const detailId = useId();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const open = hasDetail && (pinned || hover || focus);

  if (!hasDetail) {
    return { rowProps: {}, detailId: undefined, open: false, pinned: false };
  }

  const rowProps = {
    tabIndex: 0,
    role: 'button' as const,
    'aria-expanded': open,
    'aria-controls': detailId,
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onFocus: () => setFocus(true),
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setFocus(false);
        setPinned(false);
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
        e.preventDefault();
        setPinned((p) => !p);
      }
    },
    // Tap/click toggles too — iOS Safari never focuses a tabIndex div on tap,
    // so without this the details were unreachable on mobile. Links inside
    // the row keep working normally.
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('a')) return;
      setPinned((p) => !p);
    },
  };
  return { rowProps, detailId, open, pinned };
}
