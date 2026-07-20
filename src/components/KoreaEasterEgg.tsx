import { useCallback, type ReactNode } from 'react';

// Clicking "South Korea" asks the dot field under the hero to bloom, briefly,
// into the Seoul skyline drawn in its own dots (see DotField). The button only
// fires the event; the field does the drawing.
export const SKYLINE_EVENT = 'henry:seoul';

export function KoreaTrigger({ children }: { children: ReactNode }) {
  const wave = useCallback(() => {
    window.dispatchEvent(new CustomEvent(SKYLINE_EVENT));
  }, []);

  return (
    <button type="button" id="korea-trigger" onClick={wave}>
      {children}
    </button>
  );
}
