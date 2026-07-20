// Injected at build time by vite.config.ts (define)
declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

// Vite's base URL (used to resolve /cide/ toolchain assets from any route)
interface ImportMeta {
  readonly env: { readonly BASE_URL: string };
}

// Vite ?raw imports (firmware source shown in the code viewer)
declare module '*?raw' {
  const src: string;
  export default src;
}

// Vite ?url imports (pdf.js worker bundled as an asset)
declare module '*?url' {
  const href: string;
  export default href;
}

// View Transitions API (not yet in this TS lib version)
interface Document {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}
