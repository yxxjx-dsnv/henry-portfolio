import { useCallback, useRef, useState, type ReactNode } from 'react';

// The flag as an inline SVG: Windows has no flag-emoji font, so 🇰🇷 renders
// as the letters "KR" there. This draws identically everywhere.
const FLAG_SRC =
  "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 60 40%22%3E%3Crect width=%2260%22 height=%2240%22 fill=%22%23fff%22/%3E%3Cg transform=%22rotate%28-33.69 30 20%29%22%3E%3Ccircle cx=%2230%22 cy=%2220%22 r=%2210%22 fill=%22%23003478%22/%3E%3Cpath d=%22M20 20 A10 10 0 0 1 40 20 A5 5 0 0 1 30 20 A5 5 0 0 0 20 20 Z%22 fill=%22%23C60C30%22/%3E%3C/g%3E%3Cg transform=%22translate%2816.7 11.1%29 rotate%28-56.31%29%22 fill=%22%23000%22%3E%3Crect x=%22-4.5%22 y=%22-4.5%22 width=%229%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%22-1.4%22 width=%229%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%221.7000000000000002%22 width=%229%22 height=%221.8%22/%3E%3C/g%3E%3Cg transform=%22translate%2843.3 28.9%29 rotate%28-56.31%29%22 fill=%22%23000%22%3E%3Crect x=%22-4.5%22 y=%22-4.5%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%22-4.5%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%22-1.4%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%22-1.4%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%221.7000000000000002%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%221.7000000000000002%22 width=%224%22 height=%221.8%22/%3E%3C/g%3E%3Cg transform=%22translate%2843.3 11.1%29 rotate%2856.31%29%22 fill=%22%23000%22%3E%3Crect x=%22-4.5%22 y=%22-4.5%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%22-4.5%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%22-1.4%22 width=%229%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%221.7000000000000002%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%221.7000000000000002%22 width=%224%22 height=%221.8%22/%3E%3C/g%3E%3Cg transform=%22translate%2816.7 28.9%29 rotate%2856.31%29%22 fill=%22%23000%22%3E%3Crect x=%22-4.5%22 y=%22-4.5%22 width=%229%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%22-1.4%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%220.5%22 y=%22-1.4%22 width=%224%22 height=%221.8%22/%3E%3Crect x=%22-4.5%22 y=%221.7000000000000002%22 width=%229%22 height=%221.8%22/%3E%3C/g%3E%3C/svg%3E";

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
        <img
          key={f.id}
          className="kr-flag"
          src={FLAG_SRC}
          alt=""
          style={{ left: `${f.left}vw`, width: `${f.size * 1.5}px`, animationDelay: `${f.delay}s` }}
        />
      ))}
    </>
  );
}
