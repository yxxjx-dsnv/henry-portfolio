// Injected at build time by vite.config.ts (define)
declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

// View Transitions API (not yet in this TS lib version)
interface Document {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
}
