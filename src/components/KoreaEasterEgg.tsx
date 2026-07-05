import { useCallback, useRef, useState, type ReactNode } from 'react';

type Flag = { id: number; left: number; size: number; delay: number };

export function KoreaTrigger({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const nextId = useRef(0);

  const rain = useCallback(() => {
    const batch: Flag[] = Array.from({ length: 250 }, () => ({
      id: nextId.current++,
      left: Math.random() * 300,
      size: Math.random() * 24 + 16,
      delay: Math.random(),
    }));
    setFlags((prev) => [...prev, ...batch]);
    const ids = new Set(batch.map((f) => f.id));
    setTimeout(() => {
      setFlags((prev) => prev.filter((f) => !ids.has(f.id)));
    }, 10000);
  }, []);

  return (
    <>
      <button type="button" id="korea-trigger" onClick={rain}>
        {children}
      </button>
      {flags.map((f) => (
        <div
          key={f.id}
          className="kr-flag"
          style={{ left: `${f.left}vw`, fontSize: `${f.size}px`, animationDelay: `${f.delay}s` }}
        >
          🇰🇷
        </div>
      ))}
    </>
  );
}
