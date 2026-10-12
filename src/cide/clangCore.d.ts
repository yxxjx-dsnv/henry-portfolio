// Types for the vendored, patched binji/wasm-clang core (clangCore.js).
export declare class API {
  constructor(options: {
    readBuffer: (filename: string) => Promise<ArrayBuffer>;
    compileStreaming: (filename: string) => Promise<WebAssembly.Module>;
    hostWrite: (s: string) => void;
    /** Called just before the user's program starts (after compile + link). */
    onRunStart?: () => void;
    clang?: string;
    lld?: string;
    sysroot?: string;
    memfs?: string;
  });
  ready: Promise<void>;
  clangFilename: string;
  lldFilename: string;
  /** Fetch + compile a toolchain module once; later calls return the cached one. */
  getModule(name: string): Promise<WebAssembly.Module>;
  /** 'compile' while building, 'run' while the user's program executes. */
  _phase: 'compile' | 'run';
  memfs: { setStdinStr(str: string): void };
  /** Compile every .c, link, and run. `.h` files are written so #include resolves. */
  compileLinkRunMulti(
    files: { name: string; contents: string }[],
  ): Promise<{ exitCode: number; stage: 'compile' | 'link' | 'run' }>;
}
