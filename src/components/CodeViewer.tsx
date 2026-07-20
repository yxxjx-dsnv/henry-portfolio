import { Fragment, useMemo } from 'react';

// A small, dependency-free syntax highlighter for the handful of source files
// the site shows. A single left-to-right scanner handles comments, strings
// (including Python triples and JS template literals), numbers, and keywords,
// with multi-line state carried between lines.

export type CodeLang = 'cpp' | 'python' | 'tsx' | 'sh';

type LangSpec = {
  line?: string;
  block?: [string, string];
  triple?: boolean;
  template?: boolean;
  hashPre?: boolean; // C-style preprocessor lines
  keywords: Set<string>;
  builtins: Set<string>;
};

const CPP_KEYWORDS = new Set([
  'auto', 'bool', 'break', 'case', 'char', 'class', 'const', 'constexpr', 'continue',
  'default', 'delete', 'do', 'double', 'else', 'enum', 'extern', 'false', 'float', 'for',
  'if', 'inline', 'int', 'long', 'namespace', 'new', 'nullptr', 'private', 'public',
  'return', 'short', 'signed', 'sizeof', 'static', 'static_cast', 'struct', 'switch',
  'template', 'this', 'true', 'typedef', 'typename', 'union', 'unsigned', 'using',
  'virtual', 'void', 'volatile', 'while',
  'uint8_t', 'uint16_t', 'uint32_t', 'int8_t', 'int16_t', 'int32_t', 'size_t', 'byte',
]);

const LANGS: Record<CodeLang, LangSpec> = {
  cpp: {
    line: '//',
    block: ['/*', '*/'],
    hashPre: true,
    keywords: CPP_KEYWORDS,
    builtins: new Set([
      'Serial', 'Wire', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'HEX',
      'pinMode', 'analogWrite', 'digitalWrite', 'tone', 'noTone', 'delay', 'millis',
      'setup', 'loop', 'sqrt', 'fabs', 'min', 'max',
    ]),
  },
  python: {
    line: '#',
    triple: true,
    keywords: new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
      'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
      'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
      'raise', 'return', 'self', 'try', 'while', 'with', 'yield',
    ]),
    builtins: new Set([
      'print', 'len', 'range', 'enumerate', 'dict', 'list', 'set', 'tuple', 'str', 'int',
      'float', 'bool', 'open', 'isinstance', 'super', 'min', 'max', 'sum', 'sorted', 'zip',
      'Exception', 'ValueError', 'boto3', 'json', 'time', 'os', 'datetime', 'argparse', 'cv2',
    ]),
  },
  tsx: {
    line: '//',
    block: ['/*', '*/'],
    template: true,
    keywords: new Set([
      'abstract', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case', 'catch',
      'class', 'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do',
      'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function',
      'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'keyof', 'let',
      'namespace', 'never', 'new', 'null', 'number', 'of', 'private', 'protected',
      'public', 'readonly', 'return', 'static', 'string', 'super', 'switch', 'this',
      'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'unknown', 'var', 'void',
      'while', 'yield',
    ]),
    builtins: new Set([
      'console', 'window', 'document', 'fetch', 'Promise', 'JSON', 'Math', 'Date',
      'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'setTimeout',
      'setInterval', 'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback',
    ]),
  },
  sh: {
    line: '#',
    keywords: new Set([
      'if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done', 'while', 'until',
      'case', 'esac', 'function', 'select', 'return', 'exit', 'break', 'continue',
    ]),
    builtins: new Set([
      'echo', 'printf', 'cd', 'set', 'export', 'local', 'read', 'source', 'aws', 'npm',
      'node', 'python', 'python3', 'pip', 'zip', 'rm', 'cp', 'mkdir',
    ]),
  },
};

type ScanState = { end: string; cls: string } | null;

const WORD_RE = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const NUM_RE = /0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?f?/y;

function scanLine(
  line: string,
  spec: LangSpec,
  state: ScanState,
  push: (cls: string | null, text: string) => void,
): ScanState {
  let i = 0;

  // C-style preprocessor line (highlight up to any trailing line comment)
  if (state === null && spec.hashPre && /^\s*#/.test(line)) {
    const com = spec.line ? line.indexOf(spec.line) : -1;
    if (com > 0) {
      push('tk-pre', line.slice(0, com));
      push('tk-com', line.slice(com));
    } else {
      push('tk-pre', line);
    }
    return null;
  }

  while (i < line.length) {
    if (state) {
      const idx = line.indexOf(state.end, i);
      if (idx === -1) {
        push(state.cls, line.slice(i));
        return state;
      }
      push(state.cls, line.slice(i, idx + state.end.length));
      i = idx + state.end.length;
      state = null;
      continue;
    }

    const rest = line.slice(i);
    if (spec.line && rest.startsWith(spec.line)) {
      push('tk-com', rest);
      return null;
    }
    if (spec.block && rest.startsWith(spec.block[0])) {
      state = { end: spec.block[1], cls: 'tk-com' };
      push('tk-com', spec.block[0]);
      i += spec.block[0].length;
      continue;
    }
    if (spec.triple && (rest.startsWith('"""') || rest.startsWith("'''"))) {
      const q = rest.slice(0, 3);
      state = { end: q, cls: 'tk-str' };
      push('tk-str', q);
      i += 3;
      continue;
    }
    const ch = line[i];
    if (spec.template && ch === '`') {
      state = { end: '`', cls: 'tk-str' };
      push('tk-str', '`');
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) {
        if (line[j] === '\\') j += 1;
        j += 1;
      }
      j = Math.min(j + 1, line.length);
      push('tk-str', line.slice(i, j));
      i = j;
      continue;
    }
    NUM_RE.lastIndex = i;
    const num = NUM_RE.exec(line);
    if (num && /[0-9]/.test(ch)) {
      push('tk-num', num[0]);
      i += num[0].length;
      continue;
    }
    WORD_RE.lastIndex = i;
    const word = WORD_RE.exec(line);
    if (word) {
      const w = word[0];
      if (spec.keywords.has(w)) push('tk-kw', w);
      else if (spec.builtins.has(w)) push('tk-fn', w);
      else push(null, w);
      i += w.length;
      continue;
    }
    push(null, ch);
    i += 1;
  }
  return state;
}

// Highlight source into an array of lines, each a list of React nodes. Shared
// by the read-only CodeViewer and the editable CodeEditor overlay.
export function highlightLines(source: string, lang: CodeLang): React.ReactNode[][] {
  const spec = LANGS[lang];
  const result: React.ReactNode[][] = [];
  let state: ScanState = null;
  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    const nodes: React.ReactNode[] = [];
    let key = 0;
    state = scanLine(line, spec, state, (cls, text) => {
      if (text.length === 0) return;
      nodes.push(
        cls ? (
          <span key={key++} className={cls}>
            {text}
          </span>
        ) : (
          <Fragment key={key++}>{text}</Fragment>
        ),
      );
    });
    result.push(nodes);
  }
  return result;
}

export function CodeViewer({
  source,
  filename,
  meta,
  lang = 'cpp',
}: {
  source: string;
  filename: string;
  meta: string;
  lang?: CodeLang;
}) {
  const lines = useMemo(() => highlightLines(source, lang), [source, lang]);

  return (
    <div className="code-viewer">
      <div className="code-titlebar">
        <span className="code-filename">{filename}</span>
        <span className="code-meta">{meta}</span>
      </div>
      <pre className="code-body" tabIndex={0} role="region" aria-label={filename}>
        <code>
          {lines.map((nodes, i) => (
            <div className="code-line" key={i}>
              <span className="code-ln" aria-hidden="true">{i + 1}</span>
              <span className="code-src">{nodes.length > 0 ? nodes : ' '}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
