import { render, screen } from '@testing-library/react';
import { KoreaTrigger, SKYLINE_EVENT } from './KoreaEasterEgg';

test('clicking the trigger fires the skyline event for the dot field', () => {
  const spy = vi.fn();
  window.addEventListener(SKYLINE_EVENT, spy);
  render(<KoreaTrigger>South Korea</KoreaTrigger>);
  screen.getByText('South Korea').click();
  expect(spy).toHaveBeenCalledTimes(1);
  // the old flag-emoji rain is gone
  expect(document.querySelectorAll('.kr-flag')).toHaveLength(0);
  window.removeEventListener(SKYLINE_EVENT, spy);
});
