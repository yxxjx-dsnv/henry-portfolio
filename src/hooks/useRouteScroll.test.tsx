import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate, type NavigateFunction } from 'react-router-dom';
import { useRouteScroll } from './useRouteScroll';

test('leaving a #section for the page itself goes back to the top', () => {
  let go!: NavigateFunction;
  function Probe() {
    useRouteScroll();
    go = useNavigate();
    return <div id="mono" />;
  }
  const offset = vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
    return this.id === 'mono' ? 1200 : 0;
  });
  const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/projects/aerious#mono']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Probe />
    </MemoryRouter>,
  );
  expect(scroll).toHaveBeenLastCalledWith({ top: 1200, behavior: 'instant' });
  act(() => go('/projects/aerious'));
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
  offset.mockRestore();
  scroll.mockRestore();
});
