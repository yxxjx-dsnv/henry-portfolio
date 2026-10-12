import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { Expandable, Photo } from './Expandable';
import { HOLD_MS } from '../hooks/useDragSwipe';

function Counter() {
  const [n, setN] = useState(0);
  return (
    <button type="button" onClick={() => setN(n + 1)}>
      count {n}
    </button>
  );
}

test('expands in place, keeps what it holds running, and closes on Escape with focus back on its button', async () => {
  render(
    <Expandable label="Simulation">
      <Counter />
    </Expandable>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'count 0' }));
  const counter = screen.getByRole('button', { name: 'count 1' });

  fireEvent.click(screen.getByRole('button', { name: 'Expand Simulation' }));
  const dialog = screen.getByRole('dialog', { name: 'Simulation' });
  expect(dialog).toHaveClass('is-open');
  expect(document.body).toHaveClass('xp-open');
  // the same element, moved — not remounted: its state is still there
  expect(screen.getByRole('button', { name: 'count 1' })).toBe(counter);

  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.body).not.toHaveClass('xp-open');
  expect(screen.getByRole('button', { name: 'Expand Simulation' })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'count 1' })).toBe(counter);
});

test('an Escape typed in a text field inside stays the field’s', () => {
  render(
    <Expandable label="C lab">
      <textarea aria-label="code" />
    </Expandable>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Expand C lab' }));
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'code' }), { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: 'C lab' })).toBeInTheDocument();
});

test('a click on the page behind closes it', async () => {
  const { container } = render(
    <Expandable label="Deck">
      <p>slides</p>
    </Expandable>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Expand Deck' }));
  fireEvent.click(container.querySelector('.xp-backdrop')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});

test('a long press on a photo opens it, and the click that ends the press does not close it again', () => {
  vi.useFakeTimers();
  try {
    render(<Photo src="p.jpg" alt="a bridge" width={1600} height={1200} />);
    const img = screen.getByAltText('a bridge');
    fireEvent.pointerDown(img, { button: 0, pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(screen.getByRole('dialog', { name: 'a bridge' })).toHaveClass('is-open');
    fireEvent.pointerUp(img, { pointerId: 1 });
    fireEvent.click(img);
    expect(screen.getByRole('dialog', { name: 'a bridge' })).toHaveClass('is-open');
  } finally {
    vi.useRealTimers();
  }
});

test('a press that moves is a swipe, not a hold', () => {
  vi.useFakeTimers();
  try {
    render(
      <Expandable label="Photos" holdToOpen>
        <img src="p.jpg" alt="a slide" />
      </Expandable>,
    );
    const img = screen.getByAltText('a slide');
    fireEvent.pointerDown(img, { button: 0, pointerId: 1, pointerType: 'mouse', clientX: 50, clientY: 50 });
    fireEvent.pointerMove(img, { pointerId: 1, clientX: 80, clientY: 50 });
    act(() => vi.advanceTimersByTime(HOLD_MS * 2));
    expect(screen.queryByRole('dialog')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('a pointer close leaves focus be (a photo’s button stays out of sight); Escape hands it back', async () => {
  render(<Photo src="p.jpg" alt="a bridge" width={1600} height={1200} />);
  fireEvent.click(screen.getByAltText('a bridge'));
  fireEvent.click(document.querySelector('.xp-backdrop')!);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByRole('button', { name: 'Expand a bridge' })).not.toHaveFocus();

  fireEvent.click(screen.getByAltText('a bridge'));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.getByRole('button', { name: 'Expand a bridge' })).toHaveFocus();
});

test('Tab stays inside the open frame', () => {
  render(
    <Expandable label="Lab">
      <button type="button">run</button>
    </Expandable>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Expand Lab' }));
  const run = screen.getByRole('button', { name: 'run' });
  run.focus();
  fireEvent.keyDown(run, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Close Lab' })).toHaveFocus();
});
