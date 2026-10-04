import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import { createLowlight } from 'lowlight';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import { useLenis } from 'lenis/react';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { scrollToChapter } from '../data/chapters';
import { diagrams } from './diagrams';

// Minimal shape of the hast node react-markdown hands to components.
type HastNode = { type: string; tagName?: string; value?: string; properties?: { className?: unknown }; children?: HastNode[] };

function hastText(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(hastText).join('');
}

// Syntax highlighting with only the languages posts use (rehype-highlight bundles ~37).
// Register more here as needed; unknown languages render as plain text.
const lowlight = createLowlight({ bash, json, python, typescript });

function rehypeLowlight() {
  const walk = (node: HastNode) => {
    if (node.tagName === 'code') {
      const classes = Array.isArray(node.properties?.className) ? (node.properties.className as string[]) : [];
      const language = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length);
      if (language && lowlight.registered(language)) {
        node.children = lowlight.highlight(language, hastText(node)).children as HastNode[];
      }
      return;
    }
    node.children?.forEach(walk);
  };
  return (tree: unknown) => walk(tree as HastNode);
}

// "4.2 Recursive chunking" → ["4.2", "Recursive chunking"]; headings without a number pass through.
function splitNumber(children: ReactNode): [string | null, ReactNode] {
  if (typeof children !== 'string') return [null, children];
  const match = children.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);
  return match ? [match[1], match[2]] : [null, children];
}

export function scrollToHeading(id: string, lenis: ReturnType<typeof useLenis>) {
  scrollToChapter(id, lenis);
  history.replaceState(null, '', `#${id}`);
}

function CodeBlock({ language, code, children }: { language?: string; code: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="not-prose my-8 overflow-hidden rounded-[3px] border border-rule bg-paper-2">
      <div className="flex items-center justify-between border-b border-rule px-4 py-1.5">
        <span className="label">{language ?? 'code'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:text-ink"
        >
          {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} strokeWidth={1.7} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13.5px] leading-[1.7] text-ink">{children}</pre>
    </div>
  );
}

function Figure({ number, name }: { number: number; name: string }) {
  const diagram = diagrams[name];
  if (!diagram) return null;
  return (
    <figure className="not-prose my-12">
      <div className="overflow-x-auto rounded-[3px] border border-rule bg-paper px-4 py-5 sm:px-6">
        {/* Below ~600px the labels would shrink past legibility, so the figure scrolls instead. */}
        <div className="min-w-[600px]">{diagram.render()}</div>
      </div>
      <figcaption className="mt-3 text-[13.5px] text-muted">
        <span className="font-medium text-ink">Fig. {number}</span> — {diagram.caption}
      </figcaption>
    </figure>
  );
}

export default function Markdown({ body }: { body: string }) {
  const lenis = useLenis();

  // Figures are numbered in the order their ```diagram blocks appear.
  const figureNumbers = useMemo(() => {
    const names = [...body.matchAll(/^```diagram\s*\n\s*([\w-]+)/gm)].map((m) => m[1]);
    return new Map(names.map((name, i) => [name, i + 1]));
  }, [body]);

  const components = useMemo<Components>(
    () => ({
      h2({ node: _node, id, children }) {
        const [number, title] = splitNumber(children);
        return (
          <h2 id={id} data-toc-number={number ?? undefined} data-toc-title={typeof title === 'string' ? title : undefined} className="group">
            {number && <span className="label mb-4 block text-accent">§ {number}</span>}
            {title}
            {id && (
              <a href={`#${id}`} aria-label="Link to this section" className="heading-anchor" onClick={(e) => { e.preventDefault(); scrollToHeading(id, lenis); }}>
                #
              </a>
            )}
          </h2>
        );
      },
      h3({ node: _node, id, children }) {
        const [number, title] = splitNumber(children);
        return (
          <h3 id={id} data-toc-number={number ?? undefined} data-toc-title={typeof title === 'string' ? title : undefined} className="group">
            {number && <span className="mr-3 font-mono text-[0.5em] tracking-normal text-accent tabular">{number}</span>}
            {title}
            {id && (
              <a href={`#${id}`} aria-label="Link to this section" className="heading-anchor" onClick={(e) => { e.preventDefault(); scrollToHeading(id, lenis); }}>
                #
              </a>
            )}
          </h3>
        );
      },
      pre({ node, children }) {
        const code = (node as unknown as HastNode | undefined)?.children?.[0];
        const classes = Array.isArray(code?.properties?.className) ? (code.properties.className as string[]) : [];
        const language = classes.find((c) => c.startsWith('language-'))?.slice('language-'.length);
        if (code && language === 'diagram') {
          const name = hastText(code).trim();
          return <Figure name={name} number={figureNumbers.get(name) ?? 0} />;
        }
        return (
          <CodeBlock language={language} code={code ? hastText(code).replace(/\n$/, '') : ''}>
            {children}
          </CodeBlock>
        );
      },
      a({ node: _node, href = '', children }) {
        if (href.startsWith('#')) {
          const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            scrollToHeading(decodeURIComponent(href.slice(1)), lenis);
          };
          return <a href={href} onClick={onClick}>{children}</a>;
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        );
      },
      table({ node: _node, children }) {
        return (
          <div className="table-wrap">
            <table>{children}</table>
          </div>
        );
      },
    }),
    [figureNumbers, lenis],
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeSlug, rehypeKatex, rehypeLowlight]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  );
}
