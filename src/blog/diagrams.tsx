import type { ReactNode } from 'react';

/*
 * Diagrams embedded in posts with a fenced ```diagram block naming one of the keys
 * in `diagrams` below. Ink follows currentColor and the highlight is the site accent,
 * so they follow the theme. The title lives in the figure caption, not the SVG.
 */
const accent = 'var(--accent)';
const lineProps = { stroke: 'currentColor', strokeOpacity: 0.5, strokeWidth: 1.25, fill: 'none' } as const;
const quiet = { fill: 'currentColor', fillOpacity: 0.62 } as const;
const ink = { fill: 'currentColor' } as const;

function Svg({ label, viewBox, children }: { label: string; viewBox: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={label} className="h-auto w-full font-sans text-ink" fontSize="13">
      {children}
    </svg>
  );
}

function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor" fillOpacity={0.5} />
      </marker>
    </defs>
  );
}

function Box({ cx, cy, w, h = 48, highlight = false }: { cx: number; cy: number; w: number; h?: number; highlight?: boolean }) {
  return (
    <rect
      x={cx - w / 2}
      y={cy - h / 2}
      width={w}
      height={h}
      rx={4}
      fill={highlight ? accent : 'var(--paper)'}
      fillOpacity={highlight ? 0.12 : 1}
      stroke={highlight ? accent : 'currentColor'}
      strokeOpacity={highlight ? 1 : 0.45}
      strokeWidth={highlight ? 1.75 : 1.1}
    />
  );
}

function RagPipelineDiagram() {
  const W = 140, rowA = 110, rowB = 230;
  const c1 = 94, c2 = 284, c3 = 474, c4 = 664;
  const half = W / 2;
  const step = (cx: number, cy: number, text: string, highlight = false) => (
    <g>
      <Box cx={cx} cy={cy} w={W} highlight={highlight} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontWeight={highlight ? 600 : 400} {...ink}>{text}</text>
    </g>
  );
  return (
    <Svg label="RAG pipeline: ingestion turns parsed text into chunks, embeddings and a vector index; each query is embedded, searched for the top-K nearest chunks, and answered by the LLM." viewBox="0 50 760 220">
      <Arrow id="rag-arrow" />
      <text x={24} y={72} fontSize={11.5} {...quiet}>Ingestion: runs once per document</text>
      <text x={24} y={192} fontSize={11.5} {...quiet}>Query: runs on every request</text>
      <g {...lineProps}>
        <path d={`M${c1 + half} ${rowA}H${c2 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c2 + half} ${rowA}H${c3 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c3 + half} ${rowA}H${c4 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c1 + half} ${rowB}H${c2 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c2 + half} ${rowB}H${c3 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c3 + half} ${rowB}H${c4 - half}`} markerEnd="url(#rag-arrow)" />
        <path d={`M${c4} ${rowA + 24}V170H${c3}V${rowB - 24}`} markerEnd="url(#rag-arrow)" />
      </g>
      <text x={(c3 + c4) / 2} y={162} textAnchor="middle" fontSize={11.5} {...quiet}>nearest chunks</text>
      {step(c1, rowA, 'Parsed text')}
      {step(c2, rowA, 'Chunks', true)}
      {step(c3, rowA, 'Embeddings')}
      {step(c4, rowA, 'Vector index')}
      {step(c1, rowB, 'User query')}
      {step(c2, rowB, 'Embed query')}
      {step(c3, rowB, 'Top-K search')}
      {step(c4, rowB, 'LLM answer')}
    </Svg>
  );
}

function OverlapDiagram() {
  const x0 = 120, s = 592 / 1408;
  const X = (t: number) => x0 + t * s;
  const bh = 24, r1 = 100, r2 = 140, r3 = 180;
  const band = (start: number) => (
    <rect
      x={X(start)} y={r1 - 24} width={64 * s} height={r3 - r1 + 48}
      fill={accent} fillOpacity={0.12} stroke={accent} strokeWidth={1.25} strokeDasharray="4 4"
    />
  );
  const chunk = (start: number, y: number, name: string, range: string) => (
    <g>
      <rect x={X(start)} y={y - bh / 2} width={512 * s} height={bh} rx={3} {...lineProps} />
      <text x={24} y={y + 4} fontWeight={600} {...ink}>{name}</text>
      <text x={X(start + 256)} y={y + 4} textAnchor="middle" fontSize={11.5} {...quiet}>{range}</text>
    </g>
  );
  return (
    <Svg label="Three 512-token chunks with 64-token overlaps: chunk 1 covers tokens 0–511, chunk 2 covers 448–959, chunk 3 covers 896–1407." viewBox="0 36 760 200">
      <text x={24} y={54} fontSize={11.5} {...quiet}>Chunk size 512 tokens, overlap 64 tokens</text>
      {band(448)}
      {band(896)}
      <text x={X(480)} y={222} textAnchor="middle" fontSize={11.5} {...ink}>64 shared tokens</text>
      <text x={X(928)} y={222} textAnchor="middle" fontSize={11.5} {...ink}>64 shared tokens</text>
      {chunk(0, r1, 'Chunk 1', 'tokens 0–511')}
      {chunk(448, r2, 'Chunk 2', 'tokens 448–959')}
      {chunk(896, r3, 'Chunk 3', 'tokens 896–1407')}
    </Svg>
  );
}

function FailureMapDiagram() {
  const cm = 110, cs = 344, cf = 604;
  const wm = 140, ws = 212, wf = 264;
  const rows = [108, 172, 236, 300];
  const ym = 204;
  const pairs: [string, string][] = [
    ['Answer split across chunks', 'Add overlap or respect boundaries'],
    ['Buried in a noisy chunk', 'Use smaller chunks'],
    ['Chunk lost its context', 'Add headings or parent context'],
    ['Table was mangled', 'Switch to document-aware parsing'],
  ];
  return (
    <Svg label="A retrieval miss maps to four symptoms and fixes: split answers need overlap or boundaries, noisy chunks need smaller chunks, lost context needs headings or parent context, mangled tables need document-aware parsing." viewBox="0 52 760 284">
      <Arrow id="fix-arrow" />
      <text x={cs} y={70} textAnchor="middle" fontSize={11.5} {...quiet}>What the failing chunk shows</text>
      <text x={cf} y={70} textAnchor="middle" fontSize={11.5} {...quiet}>What to change</text>
      <g {...lineProps}>
        {rows.map((y) => (
          <g key={y}>
            <path d={`M${cm + wm / 2} ${ym}H210V${y}H${cs - ws / 2}`} markerEnd="url(#fix-arrow)" />
            <path d={`M${cs + ws / 2} ${y}H${cf - wf / 2}`} markerEnd="url(#fix-arrow)" />
          </g>
        ))}
      </g>
      <Box cx={cm} cy={ym} w={wm} highlight />
      <text x={cm} y={ym + 4} textAnchor="middle" fontWeight={600} {...ink}>Retrieval miss</text>
      {pairs.map(([symptom, fix], i) => (
        <g key={symptom}>
          <Box cx={cs} cy={rows[i]} w={ws} />
          <text x={cs} y={rows[i] + 4} textAnchor="middle" {...ink}>{symptom}</text>
          <Box cx={cf} cy={rows[i]} w={wf} />
          <text x={cf} y={rows[i] + 4} textAnchor="middle" {...ink}>{fix}</text>
        </g>
      ))}
    </Svg>
  );
}

export const diagrams: Record<string, { caption: string; render: () => ReactNode }> = {
  'rag-pipeline': { caption: 'The chunk, not the document, is what the LLM gets to see.', render: RagPipelineDiagram },
  overlap: { caption: 'Each chunk repeats the last 64 tokens of the one before.', render: OverlapDiagram },
  'failure-map': { caption: 'Every retrieval miss points to a specific fix.', render: FailureMapDiagram },
};
