import { render } from '@testing-library/react';
import { AutoVideo } from './AutoVideo';

test('a pause the reader makes sticks through scrolling; leaving view does not', () => {
  let report: (ratio: number) => void = () => {};
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        report = (ratio) =>
          cb([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as never);
      }
      observe() {}
      disconnect() {}
    },
  );
  // jsdom has no media playback: model paused + the play/pause events by hand
  let paused = true;
  const play = vi.fn(function (this: HTMLVideoElement) {
    paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  const pause = vi.fn(function (this: HTMLVideoElement) {
    paused = true;
    this.dispatchEvent(new Event('pause'));
  });
  const proto = HTMLMediaElement.prototype;
  vi.spyOn(proto, 'paused', 'get').mockImplementation(() => paused);
  vi.spyOn(proto, 'play').mockImplementation(play);
  vi.spyOn(proto, 'pause').mockImplementation(pause);
  try {
    const { container } = render(<AutoVideo src="/v.mp4" width={4} height={3} alt="demo" />);
    const video = container.querySelector('video')!;

    report(1);
    expect(play).toHaveBeenCalledTimes(1); // autoplays in view
    report(0);
    report(1);
    expect(play).toHaveBeenCalledTimes(2); // and again after the observer paused it

    video.pause(); // the reader pauses it
    report(0.9); // a small scroll
    report(0);
    report(1);
    expect(play).toHaveBeenCalledTimes(2); // stays paused

    video.play(); // the reader plays it again
    report(0);
    report(1);
    expect(play).toHaveBeenCalledTimes(4); // autoplay is back
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});
