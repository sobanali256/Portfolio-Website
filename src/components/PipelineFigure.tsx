import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// Fig. 1 — a general schematic of a hybrid retrieval-augmented generation
// pipeline. A query "packet" forks into dense and sparse
// retrieval, merges at the reranker and flows on to generation; the readout
// follows whichever stage it's in. Hovering a stage pins the readout. Packet
// positions are written straight to the DOM from a rAF loop so React only
// re-renders when the stage changes. Static under prefers-reduced-motion.

type StageId = 'input' | 'dense' | 'sparse' | 'rerank' | 'generate' | 'output';

interface Stage {
  id: StageId;
  n: string;
  label: string;
  name: string;
  caption: string;
  x: number;
  y: number;
  w: number;
}

const H = 52;

const STAGES: Stage[] = [
  { id: 'input', n: '01', label: 'Input', name: 'User query', x: 110, y: 0, w: 180,
    caption: 'A question comes in and becomes the search query.' },
  { id: 'dense', n: '02', label: 'Dense', name: 'Vector search', x: 8, y: 104, w: 184,
    caption: 'Semantic search: the query is embedded and matched against chunked documents in a vector store.' },
  { id: 'sparse', n: '03', label: 'Sparse', name: 'BM25 keywords', x: 208, y: 104, w: 184,
    caption: 'BM25 catches the exact terms that embeddings blur.' },
  { id: 'rerank', n: '04', label: 'Rerank', name: 'Top-k chunks', x: 110, y: 208, w: 180,
    caption: 'A reranker merges both result lists and keeps only the most relevant chunks.' },
  { id: 'generate', n: '05', label: 'Generate', name: 'LLM', x: 110, y: 304, w: 180,
    caption: 'The LLM writes the answer, grounded in the retrieved context.' },
  { id: 'output', n: '06', label: 'Output', name: 'Grounded answer', x: 110, y: 400, w: 180,
    caption: 'An answer backed by sources, not just by what the model remembers.' },
];

const BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<StageId, Stage>;

// Both routes run from inside the input node to inside the output node; the
// opaque node boxes hide the packet as it passes through them.
const ROUTES = [
  'M200 26 V70 Q200 78 192 78 H108 Q100 78 100 86 V174 Q100 182 108 182 H192 Q200 182 200 190 V426',
  'M200 26 V70 Q200 78 208 78 H292 Q300 78 300 86 V174 Q300 182 292 182 H208 Q200 182 200 190 V426',
];

// Arrowheads where a connector enters a stage.
const ARROWS: [number, number][] = [[100, 104], [300, 104], [200, 208], [200, 304], [200, 400]];

const TRAVEL_MS = 5200;
const HOLD_MS = 1600;

// Which stage a packet at height y is in; retrieval counts as one stage since
// both packets pass through it together.
function stageAt(y: number): StageId | 'retrieve' | null {
  if (y <= H) return 'input';
  if (y >= 104 && y <= 156) return 'retrieve';
  if (y >= 208 && y <= 260) return 'rerank';
  if (y >= 304 && y <= 356) return 'generate';
  if (y >= 400) return 'output';
  return null;
}

const RETRIEVE_CAPTION = 'Hybrid retrieval: semantic search and BM25 run side by side.';

export default function PipelineFigure() {
  const rootRef = useRef<HTMLElement>(null);
  const routeRefs = useRef<(SVGPathElement | null)[]>([]);
  const packetRefs = useRef<(SVGGElement | null)[]>([]);

  const [hover, setHover] = useState<StageId | null>(null);
  const [flow, setFlow] = useState<StageId | 'retrieve'>('input');
  const [inView, setInView] = useState(false);

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const paths = routeRefs.current;
    const packets = packetRefs.current;
    if (reduced || !inView || paths.some((p) => !p)) {
      packets.forEach((g) => g?.setAttribute('opacity', '0'));
      return;
    }
    const lengths = paths.map((p) => p!.getTotalLength());

    let raf = 0;
    let current: StageId | 'retrieve' | null = null;
    // Start after the connectors have drawn in.
    const start = performance.now() + 900;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const t = Math.max(0, now - start) % (TRAVEL_MS + HOLD_MS);
      const p = Math.min(1, t / TRAVEL_MS);
      // Ease in-out so the packet settles into the output node.
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      let y = 0;
      paths.forEach((path, i) => {
        const pt = path!.getPointAtLength(e * lengths[i]);
        y = pt.y;
        const g = packets[i];
        if (!g) return;
        g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        g.setAttribute('opacity', t > TRAVEL_MS + HOLD_MS - 300 ? '0' : '1');
      });
      const s = stageAt(y);
      if (s && s !== current) {
        current = s;
        setFlow(s);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView]);

  const isActive = (id: StageId) =>
    hover ? hover === id : !reduced && (flow === id || (flow === 'retrieve' && (id === 'dense' || id === 'sparse')));

  const readout = hover
    ? BY_ID[hover]
    : reduced
      ? null
      : flow === 'retrieve'
        ? { n: '02–03', label: 'Retrieve', caption: RETRIEVE_CAPTION }
        : BY_ID[flow];

  return (
    <figure ref={rootRef} className="w-full select-none" onPointerLeave={() => setHover(null)}>
      <svg
        viewBox="0 0 400 456"
        role="img"
        aria-label="Diagram of a retrieval-augmented generation pipeline: a user query is searched two ways, semantically with vector search and by keyword with BM25; a reranker keeps the most relevant chunks; an LLM then writes an answer grounded in them."
        className="block h-auto w-full overflow-visible"
      >
        {ROUTES.map((d, i) => (
          <motion.path
            key={d}
            ref={(el) => {
              routeRefs.current[i] = el;
            }}
            d={d}
            fill="none"
            className="stroke-rule-strong"
            strokeWidth={1.25}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
          />
        ))}

        {ARROWS.map(([x, y], i) => (
          <motion.path
            key={`${x}-${y}`}
            d={`M${x - 4} ${y - 7} L${x} ${y - 1} L${x + 4} ${y - 7}`}
            fill="none"
            className="stroke-rule-strong"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 + i * 0.12 }}
          />
        ))}

        {[0, 1].map((i) => (
          <g
            key={i}
            ref={(el) => {
              packetRefs.current[i] = el;
            }}
            opacity={0}
            aria-hidden="true"
          >
            <circle r={9} className="fill-accent" opacity={0.18} />
            <circle r={3.75} className="fill-accent" />
          </g>
        ))}

        {STAGES.map((s, i) => {
          const active = isActive(s.id);
          const terminal = s.id === 'output';
          return (
            <motion.g
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
              onPointerEnter={() => setHover(s.id)}
              className="cursor-default"
            >
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={H}
                rx={6}
                className={`fill-paper transition-[stroke] duration-300 ${active ? 'stroke-accent' : 'stroke-rule-strong'}`}
                strokeWidth={active ? 1.5 : 1.25}
                strokeDasharray={terminal ? '4 3' : undefined}
              />
              <text
                x={s.x + 12}
                y={s.y + 19}
                className={`font-mono transition-[fill] duration-300 ${active ? 'fill-accent' : 'fill-muted'}`}
                fontSize={10.5}
                letterSpacing="0.08em"
              >
                {s.n} · {s.label.toUpperCase()}
              </text>
              <text
                x={s.x + 12}
                y={s.y + 39}
                className={terminal ? 'fill-ink font-display italic' : 'fill-ink font-sans'}
                fontSize={terminal ? 17 : 14}
                fontWeight={terminal ? 400 : 500}
              >
                {s.name}
              </text>
            </motion.g>
          );
        })}
      </svg>

      <figcaption className="mt-5 border-t border-rule pt-3">
        <p className="text-[13px] leading-snug text-muted">
          <span className="font-medium text-ink">Fig. 1</span> — Anatomy of a hybrid RAG pipeline.
          <span className="hidden sm:inline"> Hover a stage to read it.</span>
        </p>
        <p className="mt-2 min-h-[2.8em] font-mono text-[12px] leading-[1.4] text-ink-2" aria-live="off">
          {readout ? (
            <>
              <span className="text-accent">{readout.n}</span> {readout.label} — {readout.caption}
            </>
          ) : (
            'Six stages, from a question to a grounded answer.'
          )}
        </p>
      </figcaption>
    </figure>
  );
}
