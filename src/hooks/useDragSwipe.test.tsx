import { createEvent, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { HOLD_MS, useDragSwipe } from './useDragSwipe';

function Track({ goTo, onClick }: { goTo: (i: number) => void; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDragSwipe(ref, goTo);
  return (
    <div data-testid="track" ref={ref} onClick={onClick}>
      <img alt="slide" />
    </div>
  );
}

const setup = (scrollLeft: number) => {
  const goTo = vi.fn();
  const onClick = vi.fn();
  const { container } = render(<Track goTo={goTo} onClick={onClick} />);
  const track = container.querySelector<HTMLElement>('[data-testid="track"]')!;
  Object.defineProperty(track, 'clientWidth', { value: 600 });
  track.scrollLeft = scrollLeft;
  return { goTo, onClick, track };
};

// a pointer event at a given time (testing-library cannot set timeStamp through its init)
const at = (el: HTMLElement, type: 'pointerDown' | 'pointerMove' | 'pointerUp', clientX: number, t: number) => {
  const ev = createEvent[type](el, { button: 0, pointerId: 1, pointerType: 'mouse', clientX });
  Object.defineProperty(ev, 'timeStamp', { value: t });
  fireEvent(el, ev);
};
const drag = (el: HTMLElement, xs: number[], dt = 40, t0 = 1000) => {
  at(el, 'pointerDown', xs[0], t0);
  xs.slice(1).forEach((x, i) => at(el, 'pointerMove', x, t0 + dt * (i + 1)));
  at(el, 'pointerUp', xs[xs.length - 1], t0 + dt * (xs.length - 1) + 5); // a pointerup comes where the last move was
};

test('a mouse dragged a sixth of the way left goes on to the next slide, and that is not a click', () => {
  const { goTo, onClick, track } = setup(600); // on slide 1
  drag(track, [400, 330, 250], 200);
  expect(goTo).toHaveBeenCalledWith(2);
  fireEvent.click(track);
  expect(onClick).not.toHaveBeenCalled();
});

test('a short, slow drag settles back on the same slide; a short quick flick goes on', () => {
  const slow = setup(600);
  drag(slow.track, [400, 390, 380], 200);
  expect(slow.goTo).toHaveBeenCalledWith(1);
  const quick = setup(600);
  drag(quick.track, [400, 380, 360, 340], 16); // 20 px per 16 ms
  expect(quick.goTo).toHaveBeenCalledWith(2);
});

test('a press held still past the hold time, then moved, is a hold and not a drag', () => {
  const { goTo, track } = setup(0);
  at(track, 'pointerDown', 400, 1000);
  at(track, 'pointerMove', 300, 1000 + HOLD_MS + 10);
  at(track, 'pointerUp', 300, 1000 + HOLD_MS + 20);
  expect(goTo).not.toHaveBeenCalled();
});

test('a second drag begun before the first slide has landed keeps snapping off', () => {
  const { track } = setup(600);
  drag(track, [400, 330, 250], 200);
  at(track, 'pointerDown', 400, 3000);
  at(track, 'pointerMove', 350, 3040);
  fireEvent(track, new Event('scrollend')); // the first drag's slide landing, mid second drag
  expect(track).toHaveClass('is-dragging');
});

test('a finger is left to the browser’s own swipe', () => {
  const { goTo, track } = setup(0);
  fireEvent.pointerDown(track, { button: 0, pointerId: 1, pointerType: 'touch', clientX: 400 });
  fireEvent.pointerMove(track, { pointerId: 1, clientX: 100 });
  fireEvent.pointerUp(track, { pointerId: 1, clientX: 100 });
  expect(goTo).not.toHaveBeenCalled();
});
