import '@testing-library/jest-dom';

// jsdom has no matchMedia; useDarkMode and the flash script rely on it.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom implements neither — stub them so tests pass *quietly*.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
window.scrollTo = (() => {}) as typeof window.scrollTo;
