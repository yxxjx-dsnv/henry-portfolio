import { useCallback, useEffect, useState } from 'react';

// A line worth keeping, every time Home opens — author set off to the right.
// Click it for another. A small seed renders instantly; the full pool
// (~2,000 quotes, public/quotes.json) lazy-loads behind it.
type Quote = [text: string, author: string];

const SEED: Quote[] = [
  ['Simplicity is the ultimate sophistication.', 'Leonardo da Vinci'],
  ['Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.', 'Antoine de Saint-Exupéry'],
  ['Good design is as little design as possible.', 'Dieter Rams'],
  ['Stay hungry, stay foolish.', 'Steve Jobs'],
  ['The details are not the details. They make the design.', 'Charles Eames'],
  ['What I cannot create, I do not understand.', 'Richard Feynman'],
  ['Everything should be made as simple as possible, but not simpler.', 'Albert Einstein'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Less, but better.', 'Dieter Rams'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
];

let POOL: Quote[] | null = null;
let poolPromise: Promise<void> | null = null;

const loadPool = () => {
  if (!poolPromise) {
    poolPromise = fetch('/quotes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: Quote[]) => {
        if (Array.isArray(data) && data.length > 0) POOL = data;
      })
      .catch(() => {
        /* seed keeps working */
      });
  }
  return poolPromise;
};

const pick = (avoid?: string): Quote => {
  const pool = POOL ?? SEED;
  for (let i = 0; i < 8; i++) {
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (q[0] !== avoid) return q;
  }
  return pool[Math.floor(Math.random() * pool.length)];
};

export function DailyQuote() {
  const [[text, author], setQuote] = useState<Quote>(() => pick());

  useEffect(() => {
    loadPool();
  }, []);

  const another = useCallback(() => {
    // make sure clicks can reach the full pool even on a cold cache
    loadPool();
    setQuote((cur) => pick(cur[0]));
  }, []);

  return (
    <button type="button" className="hero-quote" title="Click for another" onClick={another}>
      <em>“{text}”</em>
      <span className="hero-quote-author">— {author}</span>
    </button>
  );
}
