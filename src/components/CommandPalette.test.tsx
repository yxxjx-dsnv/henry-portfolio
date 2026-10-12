import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CommandPalette, type PaletteAction } from './CommandPalette';

const actions = (spy: (label: string) => void): PaletteAction[] =>
  ['Home', 'Projects', 'Writing'].map((label) => ({ label, run: () => spy(label) }));

test('the Enter that commits a Hangul syllable runs nothing; the next one does', () => {
  const ran = vi.fn();
  render(<CommandPalette open onClose={() => {}} actions={actions(ran)} />);
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true }); // Chrome
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 }); // Safari
  expect(ran).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
  expect(ran).toHaveBeenCalledWith('Home');
});

test('arrow keys scroll the selected row into view', () => {
  const scrolled: string[] = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.textContent ?? '');
  };
  render(<CommandPalette open onClose={() => {}} actions={actions(() => {})} />);
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(scrolled).toEqual(['Projects', 'Writing', 'Projects']);
});

test("Chrome's second Enter, right after the syllable is committed, runs nothing either", () => {
  let now = 1000;
  const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
  const ran = vi.fn();
  render(<CommandPalette open onClose={() => {}} actions={actions(ran)} />);
  const input = screen.getByRole('textbox');
  fireEvent.compositionEnd(input);
  now += 5;
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
  expect(ran).not.toHaveBeenCalled();
  now += 400; // a deliberate Enter later
  fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
  expect(ran).toHaveBeenCalledWith('Home');
  clock.mockRestore();
});
