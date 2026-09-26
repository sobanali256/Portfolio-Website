import { useEffect, useRef, useState } from 'react';

// Fig. 1 — a causal self-attention map over the site's tagline.
// The weights are hand-authored logits (not a real model), shaped so the pairs a
// reader would expect light up: "they" → "things", the second "work" → the first.
// A slow sinusoidal drift on the logits keeps it alive; hovering a cell pins that
// query row and prints its weight. Opacity is written straight to the DOM from a
// throttled rAF loop so the grid never re-renders React at animation rate.

const TOKENS = ['chasing', 'why', 'things', 'work', 'not', 'just', 'that', 'they', 'work'];
const N = TOKENS.length;

// [query, key, extra logit]
const PAIRS: [number, number, number][] = [
  [1, 0, 1.3],
  [2, 1, 1.5],
  [3, 2, 1.7],
  [4, 3, 1.4],
  [5, 4, 1.9],
  [6, 5, 0.9],
  [6, 1, 1.4],
  [7, 2, 3.1],
  [8, 3, 2.9],
  [8, 7, 1.6],
];

const BIAS: number[][] = Array.from({ length: N }, (_, i) =>
  Array.from({ length: N }, (_, j) => (i === j ? 1.1 : j === i - 1 ? 0.7 : 0)),
);
for (const [i, j, v] of PAIRS) BIAS[i][j] += v;

function attention(t: number, drift: number): number[][] {
  return BIAS.map((row, i) => {
    const logits = row.slice(0, i + 1).map((b, j) => b + drift * Math.sin(t * 0.55 + i * 1.3 + j * 0.9));
    const max = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  });
}

// Rows the idle tour visits — the ones with the most legible story.
const TOUR = [7, 8, 5, 2, 6, 4];

export default function AttentionFigure() {
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const readoutPair = useRef<HTMLSpanElement>(null);
  const readoutWeight = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  const [hover, setHover] = useState<[number, number] | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [entered, setEntered] = useState(false);

  const activeRow = hover ? hover[0] : TOUR[tourIndex];
  const active = useRef({ row: activeRow, col: hover ? hover[1] : -1 });
  active.current = { row: activeRow, col: hover ? hover[1] : -1 };

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setEntered(true);
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Idle tour through the interesting query rows.
  useEffect(() => {
    if (hover || reduced || !inView) return;
    const id = window.setInterval(() => setTourIndex((i) => (i + 1) % TOUR.length), 2600);
    return () => window.clearInterval(id);
  }, [hover, reduced, inView]);

  useEffect(() => {
    const paint = (W: number[][]) => {
      const { row, col } = active.current;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j <= i; j++) {
          const el = cells.current[i * N + j];
          if (!el) continue;
          const focus = i === row ? 1 : 0.32;
          el.style.opacity = String(0.06 + 0.94 * Math.pow(W[i][j], 0.7) * focus);
        }
      }
      const r = W[row];
      const c = col >= 0 && col <= row ? col : r.indexOf(Math.max(...r));
      if (readoutPair.current) readoutPair.current.textContent = `${TOKENS[row]} → ${TOKENS[c]}`;
      if (readoutWeight.current) readoutWeight.current.textContent = r[c].toFixed(2);
    };

    if (reduced || !inView) {
      paint(attention(0, 0));
      return;
    }

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 50 || document.hidden) return;
      last = now;
      paint(attention((now - start) / 1000, 0.35));
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView, activeRow, hover]);

  return (
    <figure ref={rootRef} className="w-full select-none" onPointerLeave={() => setHover(null)}>
      <div
        role="img"
        aria-label="Heatmap of causal self-attention weights over the phrase 'chasing why things work, not just that they work'. The word 'they' attends most strongly to 'things', and the second 'work' to the first."
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `minmax(3.5rem, auto) repeat(${N}, minmax(0, 1fr))` }}
      >
        {/* Column (key) labels */}
        <div />
        {TOKENS.map((tok, j) => (
          <div key={`k${j}`} className="relative h-14 sm:h-16" aria-hidden="true">
            <span
              className={`absolute bottom-1 left-1/2 origin-bottom-left -rotate-55 whitespace-nowrap font-mono text-[10px] sm:text-[11px] transition-colors duration-200 ${
                hover && hover[1] === j ? 'text-accent' : 'text-muted'
              }`}
            >
              {tok}
            </span>
          </div>
        ))}

        {TOKENS.map((tok, i) => (
          <div key={`r${i}`} className="contents">
            <div
              aria-hidden="true"
              className={`flex items-center justify-end pr-2 font-mono text-[10px] sm:text-[11px] transition-colors duration-200 ${
                i === activeRow ? 'text-ink' : 'text-muted'
              }`}
            >
              {tok}
            </div>
            {TOKENS.map((_, j) => {
              const masked = j > i;
              return (
                <div
                  key={j}
                  aria-hidden="true"
                  onPointerEnter={masked ? undefined : () => setHover([i, j])}
                  className="relative aspect-square"
                >
                  {masked ? (
                    <div className="absolute inset-0 rounded-[2px] border border-dashed border-rule" />
                  ) : (
                    <div
                      ref={(el) => {
                        cells.current[i * N + j] = el;
                      }}
                      className={`absolute inset-0 rounded-[2px] bg-accent transition-opacity duration-300 ${
                        hover && hover[0] === i && hover[1] === j ? 'ring-2 ring-ink ring-offset-1 ring-offset-paper' : ''
                      }`}
                      style={{
                        opacity: 0.06,
                        transform: entered ? 'scale(1)' : 'scale(0.3)',
                        transition: `transform 700ms var(--ease-out-expo) ${(i + j) * 28}ms, opacity 300ms var(--ease-out-quart)`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <figcaption className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-rule pt-3">
        <span className="text-[13px] leading-snug text-muted">
          <span className="font-medium text-ink">Fig. 1</span> — Causal self-attention over my working motto.
          <span className="hidden sm:inline"> Hover a cell to read it.</span>
        </span>
        <span className="font-mono text-[12px] text-ink tabular whitespace-nowrap">
          <span ref={readoutPair} /> <span className="text-muted">·</span>{' '}
          <span ref={readoutWeight} className="text-accent" />
        </span>
      </figcaption>
    </figure>
  );
}
