import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Fig. 1 — two general schematics that take turns: a hybrid RAG pipeline (1a) and
// an AI end-to-end testing loop (1b). In each, two "packets" travel the diagram's
// routes at the same speed, so on unequal routes one arrives and waits while the
// other keeps going (1b's failing case loops back through repair). The readout
// follows the lead packet's stage; hovering a stage pins it. Packet positions are
// written straight to the DOM from a rAF loop, so React only re-renders when the
// stage changes.
//
// The panels fade out and in, one after the other, when the progress hairline
// under the active tab finishes its CSS animation. Hovering or scrolling away
// pauses that animation, so the switch pauses with it. Under
// prefers-reduced-motion nothing moves and nothing auto-advances; the tabs still
// switch panels by hand.

type Shape = 'box' | 'pill' | 'window' | 'chip';

interface Stage {
  id: string;
  n: string;
  label: string;
  name: string;
  caption: string;
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: Shape;
  terminal?: boolean;
  // window: the URL shown in its address bar and the step lines inside it
  url?: string;
  steps?: string[];
  // chip: the verdict icon
  icon?: 'check' | 'cross';
}

interface Group {
  n: string;
  label: string;
  caption: string;
  members: string[];
}

interface Diagram {
  id: string;
  tab: string;
  title: string;
  ariaLabel: string;
  idle: string;
  stages: Stage[];
  // Two routes; both start inside the first stage. The second is the lead: the
  // readout follows it, so it should be the longer route when they differ.
  routes: [string, string];
  // Arrowheads: [tip x, tip y, direction].
  arrows: [number, number, 'down' | 'left'][];
  // [x0, y0, x1, y1, stage or group id]: the first rect containing the lead
  // packet names its stage.
  zones: [number, number, number, number, string][];
  groups: Record<string, Group>;
  // Zone ids for a window's step lines, in order, and the zones that count as
  // "after" the window (every step shown done).
  stepZones?: string[];
  afterZones?: string[];
  notes?: { x: number; y: number; text: string; rotate?: number }[];
}

const DIAGRAMS: Diagram[] = [
  {
    id: 'rag',
    tab: 'Retrieval',
    title: 'Anatomy of a hybrid RAG pipeline.',
    ariaLabel:
      'Diagram of a retrieval-augmented generation pipeline: a user query is searched two ways, semantically with vector search and by keyword with BM25; a reranker keeps the most relevant chunks; an LLM then writes an answer grounded in them.',
    idle: 'Six stages, from a question to a grounded answer.',
    stages: [
      { id: 'input', n: '01', label: 'Input', name: 'User query', x: 110, y: 0, w: 180, h: 52,
        caption: 'A question comes in and becomes the search query.' },
      { id: 'dense', n: '02', label: 'Dense', name: 'Vector search', x: 8, y: 104, w: 184, h: 52,
        caption: 'Semantic search: the query is embedded and matched against chunked documents in a vector store.' },
      { id: 'sparse', n: '03', label: 'Sparse', name: 'BM25 keywords', x: 208, y: 104, w: 184, h: 52,
        caption: 'BM25 catches the exact terms that embeddings blur.' },
      { id: 'rerank', n: '04', label: 'Rerank', name: 'Top-k chunks', x: 110, y: 208, w: 180, h: 52,
        caption: 'A reranker merges both result lists and keeps only the most relevant chunks.' },
      { id: 'generate', n: '05', label: 'Generate', name: 'LLM', x: 110, y: 304, w: 180, h: 52,
        caption: 'The LLM writes the answer, grounded in the retrieved context.' },
      { id: 'output', n: '06', label: 'Output', name: 'Grounded answer', x: 110, y: 400, w: 180, h: 52, terminal: true,
        caption: 'An answer backed by sources, not just by what the model remembers.' },
    ],
    routes: [
      'M200 26 V70 Q200 78 192 78 H108 Q100 78 100 86 V174 Q100 182 108 182 H192 Q200 182 200 190 V426',
      'M200 26 V70 Q200 78 208 78 H292 Q300 78 300 86 V174 Q300 182 292 182 H208 Q200 182 200 190 V426',
    ],
    arrows: [[100, 104, 'down'], [300, 104, 'down'], [200, 208, 'down'], [200, 304, 'down'], [200, 400, 'down']],
    zones: [
      [0, 0, 400, 52, 'input'],
      [0, 104, 400, 156, 'retrieve'],
      [0, 208, 400, 260, 'rerank'],
      [0, 304, 400, 356, 'generate'],
      [0, 400, 400, 456, 'output'],
    ],
    groups: {
      retrieve: {
        n: '02–03',
        label: 'Retrieve',
        caption: 'Hybrid retrieval: semantic search and BM25 run side by side.',
        members: ['dense', 'sparse'],
      },
    },
  },
  {
    id: 'e2e',
    tab: 'Testing',
    title: 'Anatomy of an AI end-to-end testing loop.',
    ariaLabel:
      'Diagram of an AI end-to-end testing loop: an application’s code and requirements are indexed; an LLM writes test cases; a person approves them; each approved case runs as a Playwright script in a real browser, opening the page, filling the form and asserting the result. One case passes and keeps its evidence; the other fails, is triaged, and a script fault is repaired and rerun.',
    idle: 'Two test cases, one loop: from code to a verdict, and back when a script breaks.',
    stages: [
      { id: 'source', n: '01', label: 'Source', name: 'Code + requirements', x: 100, y: 0, w: 180, h: 52,
        caption: 'The app’s code and requirements are indexed, so every test traces back to something real.' },
      { id: 'cases', n: '02', label: 'Generate', name: 'LLM test cases', x: 100, y: 88, w: 180, h: 52,
        caption: 'An LLM reads them and writes scenarios and step-by-step test cases.' },
      { id: 'review', n: '03', label: 'Gate', name: 'Human approval', x: 105, y: 176, w: 170, h: 44, shape: 'pill',
        caption: 'A person approves each case; nothing runs unreviewed.' },
      { id: 'run', n: '04', label: 'Run', name: 'Playwright', x: 50, y: 252, w: 280, h: 112, shape: 'window',
        url: 'app.test/checkout',
        steps: ['Open the page', 'Fill the form', 'Assert the result'],
        caption: 'Each approved case runs as a Playwright script in a real browser, against the live app.' },
      { id: 'pass', n: '05', label: 'Pass', name: 'Evidence kept', x: 20, y: 400, w: 150, h: 44, shape: 'chip', icon: 'check',
        caption: 'A pass keeps its trace and screenshots as evidence.' },
      { id: 'fail', n: '06', label: 'Fail', name: 'Triaged', x: 190, y: 400, w: 150, h: 44, shape: 'chip', icon: 'cross',
        caption: 'A failure is triaged from the trace, console and screenshot: an app bug or a script bug.' },
    ],
    routes: [
      'M190 26 V374 Q190 382 182 382 H103 Q95 382 95 390 V422',
      'M190 26 V374 Q190 382 198 382 H257 Q265 382 265 390 V414 Q265 422 273 422 H364 Q372 422 372 414 V316 Q372 308 364 308 H300',
    ],
    arrows: [[190, 88, 'down'], [190, 176, 'down'], [190, 252, 'down'], [95, 400, 'down'], [265, 400, 'down'], [330, 308, 'left']],
    zones: [
      [292, 296, 345, 320, 'rerun'],
      [345, 290, 400, 440, 'repair'],
      [0, 0, 400, 52, 'source'],
      [0, 88, 400, 140, 'cases'],
      [0, 176, 400, 220, 'review'],
      [0, 252, 400, 312, 'step1'],
      [0, 312, 400, 332, 'step2'],
      [0, 332, 400, 364, 'step3'],
      [0, 380, 345, 456, 'verdict'],
    ],
    stepZones: ['step1', 'step2', 'step3'],
    afterZones: ['verdict', 'repair', 'rerun'],
    groups: {
      step1: { n: '04', label: 'Run', caption: 'Approved cases become Playwright scripts that drive a real browser.', members: ['run'] },
      step2: { n: '04', label: 'Run', caption: 'Each step acts on the live page the way a user would.', members: ['run'] },
      step3: { n: '04', label: 'Run', caption: 'Assertions check what the app actually did, not just that the script ran.', members: ['run'] },
      verdict: {
        n: '05–06',
        label: 'Verdict',
        caption: 'Two cases, two outcomes: a pass keeps its evidence, a failure gets triaged.',
        members: ['pass', 'fail'],
      },
      repair: {
        n: '↺',
        label: 'Repair',
        caption: 'A script bug is repaired and the case rerun; an app bug is reported, not patched over.',
        members: ['fail'],
      },
      rerun: { n: '04', label: 'Rerun', caption: 'The repaired script runs again against the live app.', members: ['run'] },
    },
    notes: [{ x: 386, y: 365, text: 'repair · rerun', rotate: -90 }],
  },
];

const TRAVEL_MS = 5200;
const HOLD_MS = 1600;
const DRAW_IN_MS = 900;
// Each panel shows two full packet cycles before handing over.
const PANEL_MS = DRAW_IN_MS + 2 * (TRAVEL_MS + HOLD_MS);

function zoneAt(d: Diagram, x: number, y: number): string | null {
  for (const [x0, y0, x1, y1, id] of d.zones) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return id;
  return null;
}

function arrowPath(x: number, y: number, dir: 'down' | 'left') {
  return dir === 'down'
    ? `M${x - 4} ${y - 7} L${x} ${y - 1} L${x + 4} ${y - 7}`
    : `M${x + 7} ${y - 4} L${x + 1} ${y} L${x + 7} ${y + 4}`;
}

const CHECK = (cx: number, cy: number, s: number) =>
  `M${cx - s} ${cy} L${cx - s * 0.3} ${cy + s * 0.7} L${cx + s} ${cy - s * 0.7}`;
const CROSS = (cx: number, cy: number, s: number) =>
  `M${cx - s} ${cy - s} L${cx + s} ${cy + s} M${cx + s} ${cy - s} L${cx - s} ${cy + s}`;

interface StageViewProps {
  s: Stage;
  active: boolean;
  // window only: index of the step in progress (-1 none), or steps.length when all done
  step: number;
}

function StageView({ s, active, step }: StageViewProps) {
  const stroke = `transition-[stroke] duration-300 ${active ? 'stroke-accent' : 'stroke-rule-strong'}`;
  const sw = active ? 1.5 : 1.25;
  const label = `font-mono transition-[fill] duration-300 ${active ? 'fill-accent' : 'fill-muted'}`;

  if (s.shape === 'pill') {
    const cy = s.y + s.h / 2;
    const ix = s.x + 22;
    return (
      <>
        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.h / 2} className={`fill-paper ${stroke}`} strokeWidth={sw} />
        <circle cx={ix} cy={cy} r={9} className={`transition-[fill] duration-300 ${active ? 'fill-accent' : 'fill-rule'}`} />
        <path d={CHECK(ix, cy, 4)} fill="none" className={active ? 'stroke-accent-ink' : 'stroke-ink'} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <text x={ix + 17} y={cy - 3} className={label} fontSize={9.5} letterSpacing="0.08em">
          {s.n} · {s.label.toUpperCase()}
        </text>
        <text x={ix + 17} y={cy + 12} className="fill-ink font-sans" fontSize={14} fontWeight={500}>
          {s.name}
        </text>
      </>
    );
  }

  if (s.shape === 'chip') {
    const cy = s.y + s.h / 2;
    const ix = s.x + 22;
    return (
      <>
        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.h / 2} className={`fill-paper ${stroke}`} strokeWidth={sw} strokeDasharray="4 3" />
        <circle cx={ix} cy={cy} r={9} fill="none" className={stroke} strokeWidth={sw} />
        <path
          d={s.icon === 'check' ? CHECK(ix, cy, 4) : CROSS(ix, cy, 3.4)}
          fill="none"
          className={active ? 'stroke-accent' : 'stroke-ink'}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x={ix + 17} y={cy - 3} className={label} fontSize={9.5} letterSpacing="0.08em">
          {s.n} · {s.label.toUpperCase()}
        </text>
        <text x={ix + 17} y={cy + 12} className="fill-ink font-display italic" fontSize={15}>
          {s.name}
        </text>
      </>
    );
  }

  if (s.shape === 'window') {
    const bar = 22;
    return (
      <>
        <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={7} className={`fill-paper ${stroke}`} strokeWidth={sw} />
        <line x1={s.x} x2={s.x + s.w} y1={s.y + bar} y2={s.y + bar} className="stroke-rule" strokeWidth={1} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={s.x + 12 + i * 10} cy={s.y + bar / 2} r={3} className="fill-rule-strong" />
        ))}
        <rect x={s.x + 48} y={s.y + 5} width={s.w - 60} height={12} rx={6} className="fill-paper-2" />
        <text x={s.x + 58} y={s.y + 14} className="fill-muted font-mono" fontSize={8.5}>
          {s.url}
        </text>
        <text x={s.x + 14} y={s.y + bar + 18} className={label} fontSize={10.5} letterSpacing="0.08em">
          {s.n} · {s.label.toUpperCase()} · {s.name.toUpperCase()}
        </text>
        {s.steps?.map((txt, i) => {
          const sy = s.y + bar + 40 + i * 20;
          const done = i < step;
          const now = i === step;
          return (
            <g key={txt}>
              <circle
                cx={s.x + 20}
                cy={sy - 4}
                r={5.5}
                className={`transition-[fill,stroke] duration-300 ${now ? 'fill-accent stroke-accent' : done ? 'fill-paper stroke-ink' : 'fill-paper stroke-rule-strong'}`}
                strokeWidth={1.2}
              />
              {done && (
                <path d={CHECK(s.x + 20, sy - 4, 2.6)} fill="none" className="stroke-ink" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
              )}
              <text
                x={s.x + 34}
                y={sy}
                className={`font-sans transition-[fill] duration-300 ${now || done ? 'fill-ink' : 'fill-muted'}`}
                fontSize={13}
              >
                {txt}
              </text>
            </g>
          );
        })}
      </>
    );
  }

  return (
    <>
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={6}
        className={`fill-paper ${stroke}`}
        strokeWidth={sw}
        strokeDasharray={s.terminal ? '4 3' : undefined}
      />
      <text x={s.x + 12} y={s.y + 19} className={label} fontSize={10.5} letterSpacing="0.08em">
        {s.n} · {s.label.toUpperCase()}
      </text>
      <text
        x={s.x + 12}
        y={s.y + 39}
        className={s.terminal ? 'fill-ink font-display italic' : 'fill-ink font-sans'}
        fontSize={s.terminal ? 17 : 14}
        fontWeight={s.terminal ? 400 : 500}
      >
        {s.name}
      </text>
    </>
  );
}

interface PanelProps {
  diagram: Diagram;
  reduced: boolean;
  running: boolean;
  flow: string | null;
  isActive: (id: string) => boolean;
  onHover: (id: string) => void;
  onFlow: (diagramId: string, zone: string) => void;
}

// One diagram, with its own refs and packet loop, so each panel starts cleanly on
// mount; the outgoing one fades out before the next mounts (mode="wait").
function Panel({ diagram, reduced, running, flow, isActive, onHover, onFlow }: PanelProps) {
  const routeRefs = useRef<(SVGPathElement | null)[]>([]);
  const packetRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const paths = routeRefs.current;
    const packets = packetRefs.current;
    if (reduced || !running || paths.some((p) => !p)) {
      packets.forEach((g) => g?.setAttribute('opacity', '0'));
      return;
    }
    const lengths = paths.map((p) => p!.getTotalLength());
    const longest = Math.max(...lengths);
    const lead = paths.length - 1;

    let raf = 0;
    let current: string | null = null;
    // Start after the connectors have drawn in.
    const start = performance.now() + DRAW_IN_MS;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const t = Math.max(0, now - start) % (TRAVEL_MS + HOLD_MS);
      const p = Math.min(1, t / TRAVEL_MS);
      // Ease in-out over the longest route; every packet covers the same distance
      // at the same moment, so a shorter route's packet arrives and waits.
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      let lx = 0;
      let ly = 0;
      paths.forEach((path, i) => {
        const pt = path!.getPointAtLength(Math.min(e * longest, lengths[i]));
        if (i === lead) {
          lx = pt.x;
          ly = pt.y;
        }
        const g = packets[i];
        if (!g) return;
        g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        g.setAttribute('opacity', now < start || t > TRAVEL_MS + HOLD_MS - 300 ? '0' : '1');
      });
      const z = now < start ? null : zoneAt(diagram, lx, ly);
      if (z && z !== current) {
        current = z;
        onFlow(diagram.id, z);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, running, diagram, onFlow]);

  // Which step line of a window is in progress.
  const steps = diagram.stepZones ?? [];
  const stepIndex = flow
    ? steps.includes(flow)
      ? steps.indexOf(flow)
      : diagram.afterZones?.includes(flow)
        ? steps.length
        : -1
    : -1;

  return (
    <motion.svg
      viewBox="0 0 400 456"
      role="img"
      aria-label={diagram.ariaLabel}
      className="absolute inset-0 h-full w-full overflow-visible"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {diagram.routes.map((d, i) => (
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

      {diagram.arrows.map(([x, y, dir], i) => (
        <motion.path
          key={`${x}-${y}`}
          d={arrowPath(x, y, dir)}
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

      {diagram.notes?.map((n) => (
        <motion.text
          key={n.text}
          x={n.x}
          y={n.y}
          textAnchor="middle"
          transform={n.rotate ? `rotate(${n.rotate} ${n.x} ${n.y})` : undefined}
          className="fill-muted font-mono"
          fontSize={9.5}
          letterSpacing="0.08em"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
        >
          {n.text}
        </motion.text>
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

      {diagram.stages.map((s, i) => (
        <motion.g
          key={s.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.12 }}
          onPointerEnter={() => onHover(s.id)}
          className="cursor-default"
        >
          <StageView s={s} active={isActive(s.id)} step={s.shape === 'window' ? stepIndex : -1} />
        </motion.g>
      ))}
    </motion.svg>
  );
}

export default function PipelineFigure() {
  const rootRef = useRef<HTMLElement>(null);

  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [flow, setFlow] = useState<string | null>(null);
  const [inView, setInView] = useState(false);

  const diagram = DIAGRAMS[index];
  const byId = Object.fromEntries(diagram.stages.map((s) => [s.id, s]));

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const show = (i: number) => {
    setIndex(i);
    setHover(null);
    setFlow(null);
  };

  // Stable identity so a panel's loop isn't restarted on every render. The
  // outgoing panel keeps reporting while it fades; only the current one counts.
  const currentId = useRef(diagram.id);
  currentId.current = diagram.id;
  const onFlow = useCallback((diagramId: string, zone: string) => {
    if (diagramId === currentId.current) setFlow(zone);
  }, []);

  const isActive = (id: string) => {
    if (hover) return hover === id;
    if (reduced || !flow) return false;
    return flow === id || (diagram.groups[flow]?.members.includes(id) ?? false);
  };

  const readout = hover
    ? byId[hover]
    : !reduced && flow
      ? (diagram.groups[flow] ?? byId[flow])
      : null;

  const paused = hover !== null || !inView;

  return (
    <figure ref={rootRef} className="w-full select-none" onPointerLeave={() => setHover(null)}>
      <div className="relative aspect-[400/456] w-full">
        <AnimatePresence initial={false} mode="wait">
          <Panel
            key={diagram.id}
            diagram={diagram}
            reduced={reduced}
            running={inView}
            flow={hover ? null : flow}
            isActive={isActive}
            onHover={setHover}
            onFlow={onFlow}
          />
        </AnimatePresence>
      </div>

      <figcaption className="mt-5 border-t border-rule pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="text-[13px] leading-snug text-muted">
            <span className="font-medium text-ink">Fig. 1{String.fromCharCode(97 + index)}</span> — {diagram.title}
          </p>
          <div className="flex gap-4" role="group" aria-label="Choose a figure">
            {DIAGRAMS.map((d, i) => {
              const current = i === index;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => show(i)}
                  aria-pressed={current}
                  className={`relative pb-1.5 font-mono text-[11.5px] transition-colors duration-200 ${
                    current ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  {String.fromCharCode(97 + i)} · {d.tab}
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule" />
                  {current && !reduced && (
                    <span
                      key={diagram.id}
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
                      style={{
                        animation: `fig-progress ${PANEL_MS}ms linear forwards`,
                        animationPlayState: paused ? 'paused' : 'running',
                      }}
                      onAnimationEnd={() => show((index + 1) % DIAGRAMS.length)}
                    />
                  )}
                  {current && reduced && (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 min-h-[2.8em] font-mono text-[12px] leading-[1.4] text-ink-2">
          {readout ? (
            <>
              <span className="text-accent">{readout.n}</span> {readout.label} — {readout.caption}
            </>
          ) : (
            diagram.idle
          )}
        </p>
      </figcaption>
    </figure>
  );
}
