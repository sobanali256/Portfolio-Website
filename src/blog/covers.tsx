// Cover plates for posts: themed SVGs, so they follow light/dark mode and stay crisp
// at any size. Colours come from the palette custom properties in index.css.

const c = (name: string) => `var(--${name})`;

// Deterministic "line of text" widths, as fractions of the column.
const LINE_WIDTHS = [
  0.94, 0.88, 0.97, 0.72, 0.9, 0.95, 0.83, 0.6, 0.92, 0.86, 0.97, 0.78, 0.9, 0.68, 0.95, 0.89, 0.93, 0.74, 0.88, 0.55,
];

// [first line, last line] of each chunk; neighbours share two lines (the overlap).
const CHUNKS: [number, number][] = [
  [0, 6],
  [5, 11],
  [10, 16],
  [15, 19],
];
const ACTIVE = 1;

// A few fixed "embedding" values per chunk, rendered as cell opacity.
const VECTORS = [
  [0.7, 0.2, 0.5, 0.9, 0.3, 0.6, 0.15, 0.8],
  [0.3, 0.95, 0.4, 0.15, 0.85, 0.5, 0.7, 0.25],
  [0.55, 0.35, 0.8, 0.45, 0.2, 0.9, 0.4, 0.6],
  [0.2, 0.6, 0.3, 0.75, 0.5, 0.25, 0.85, 0.4],
];

export function ChunkingCover({ className = '' }: { className?: string }) {
  const x0 = 72;
  const colW = 300;
  const y0 = 104;
  const gap = 16;
  const lineY = (i: number) => y0 + i * gap;
  const top = (i: number) => lineY(i) - 7;
  const bottom = (i: number) => lineY(i) + 7;

  const rowX = 520;
  const rowY = (i: number) => 150 + i * 72;
  const cell = 22;

  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label="A column of text lines divided into four overlapping chunks, each mapped to an embedding vector; the second chunk is highlighted."
      className={className}
    >
      <defs>
        <pattern id="cover-rule" width="800" height="24" patternUnits="userSpaceOnUse">
          <line x1="0" y1="23.5" x2="800" y2="23.5" style={{ stroke: c('rule'), strokeOpacity: 0.6 }} />
        </pattern>
        <pattern id="cover-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: c('accent'), strokeOpacity: 0.45 }} strokeWidth="2" />
        </pattern>
      </defs>

      <rect width="800" height="500" style={{ fill: c('paper-2') }} />
      <rect width="800" height="500" fill="url(#cover-rule)" />

      {/* Running heads */}
      <g className="font-mono" fontSize="11" letterSpacing="1.6" style={{ fill: c('muted') }}>
        <text x={x0} y="58">DOCUMENT</text>
        <text x={rowX} y="58">CHUNK → VECTOR</text>
        <text x={x0} y="452">SIZE 512 · OVERLAP 64</text>
        <text x="728" y="452" textAnchor="end">
          K = 5
        </text>
      </g>
      <line x1={x0} y1="72" x2="728" y2="72" style={{ stroke: c('rule-strong') }} />
      <line x1={x0} y1="428" x2="728" y2="428" style={{ stroke: c('rule-strong') }} />

      {/* The active chunk's band, with its overlaps hatched */}
      <rect
        x={x0 - 10}
        y={top(CHUNKS[ACTIVE][0])}
        width={colW + 20}
        height={bottom(CHUNKS[ACTIVE][1]) - top(CHUNKS[ACTIVE][0])}
        rx="3"
        style={{ fill: c('accent'), fillOpacity: 0.1 }}
      />
      {[
        [CHUNKS[ACTIVE][0], CHUNKS[ACTIVE - 1][1]],
        [CHUNKS[ACTIVE + 1][0], CHUNKS[ACTIVE][1]],
      ].map(([a, b]) => (
        <rect key={a} x={x0 - 10} y={top(a)} width={colW + 20} height={bottom(b) - top(a)} fill="url(#cover-hatch)" />
      ))}

      {/* Lines of text */}
      {LINE_WIDTHS.map((w, i) => {
        const active = i >= CHUNKS[ACTIVE][0] && i <= CHUNKS[ACTIVE][1];
        return (
          <rect
            key={i}
            x={x0}
            y={lineY(i) - 2.5}
            width={colW * w}
            height="5"
            rx="2.5"
            style={{ fill: active ? c('ink') : c('rule-strong'), fillOpacity: active ? 0.75 : 1 }}
          />
        );
      })}

      {/* Chunk brackets, alternating columns so the overlaps read */}
      {CHUNKS.map(([a, b], i) => {
        const bx = x0 + colW + 26 + (i % 2) * 16;
        const active = i === ACTIVE;
        const stroke = active ? c('accent') : c('muted');
        const mid = (top(a) + bottom(b)) / 2;
        return (
          <g key={i}>
            <path
              d={`M${bx - 6} ${top(a)}H${bx}V${bottom(b)}H${bx - 6}`}
              fill="none"
              style={{ stroke }}
              strokeWidth={active ? 2 : 1.25}
            />
            <path
              d={`M${bx} ${mid}C${bx + 60} ${mid} ${rowX - 70} ${rowY(i)} ${rowX - 14} ${rowY(i)}`}
              fill="none"
              style={{ stroke, strokeOpacity: active ? 1 : 0.5 }}
              strokeWidth={active ? 1.5 : 1}
              strokeDasharray={active ? undefined : '3 4'}
            />
          </g>
        );
      })}

      {/* Embedding rows */}
      {VECTORS.map((v, i) => {
        const active = i === ACTIVE;
        return (
          <g key={i}>
            <text
              x={rowX}
              y={rowY(i) - 18}
              className="font-mono"
              fontSize="11"
              letterSpacing="1"
              style={{ fill: active ? c('accent') : c('muted') }}
            >
              {`c${String(i + 1).padStart(2, '0')}`}
            </text>
            {v.map((value, j) => (
              <rect
                key={j}
                x={rowX + j * (cell + 3)}
                y={rowY(i) - cell / 2}
                width={cell}
                height={cell}
                rx="2"
                style={{
                  fill: active ? c('accent') : c('ink'),
                  fillOpacity: active ? 0.2 + value * 0.8 : 0.06 + value * 0.3,
                }}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
