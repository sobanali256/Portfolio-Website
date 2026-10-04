import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { useLenis } from 'lenis/react';
import { NAV_HEIGHT } from '../data/chapters';
import { scrollToHeading } from './Markdown';

export interface Heading {
  id: string;
  level: 2 | 3;
  number: string | null;
  title: string;
}

// Collect the article's h2/h3 once it has rendered. The Markdown renderer puts the
// clean title and section number in data attributes, so the "#" anchor isn't included.
export function useHeadings(articleRef: RefObject<HTMLElement | null>, body: string | null): Heading[] {
  const [headings, setHeadings] = useState<Heading[]>([]);
  useEffect(() => {
    const root = articleRef.current;
    if (!root || !body) return;
    const nodes = root.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]');
    setHeadings(
      [...nodes].map((el) => ({
        id: el.id,
        level: el.tagName === 'H2' ? 2 : 3,
        number: el.dataset.tocNumber ?? null,
        title: el.dataset.tocTitle ?? el.textContent?.replace(/#$/, '').trim() ?? '',
      })),
    );
  }, [articleRef, body]);
  return headings;
}

// The heading whose top has most recently passed just under the fixed nav.
export function useActiveHeading(headings: Heading[]): string {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (headings.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = '';
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= NAV_HEIGHT + 96) current = id;
      }
      // At the very bottom the last headings can't scroll up to the line; mark the last one.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = headings[headings.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings]);
  return active;
}

// Group h3s under their h2.
function group(headings: Heading[]) {
  const sections: { heading: Heading; children: Heading[] }[] = [];
  for (const h of headings) {
    if (h.level === 2 || sections.length === 0) sections.push({ heading: h, children: [] });
    else sections[sections.length - 1].children.push(h);
  }
  return sections;
}

interface TocProps {
  headings: Heading[];
  active: string;
  onNavigate?: () => void;
}

export default function TableOfContents({ headings, active, onNavigate }: TocProps) {
  const lenis = useLenis();
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    onNavigate?.();
    requestAnimationFrame(() => scrollToHeading(id, lenis));
  };

  // Keep the active entry visible in the sidebar's own scroll box (marked with
  // data-toc-scroll), centring it when it drifts out of the middle of the box.
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const box = list?.closest<HTMLElement>('[data-toc-scroll]');
    if (!list || !box || !active || box.scrollHeight <= box.clientHeight) return;
    const link = list.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const margin = box.clientHeight * 0.25;
    if (top >= margin && top + link.offsetHeight <= box.clientHeight - margin) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({
      top: box.scrollTop + top - (box.clientHeight - link.offsetHeight) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [active]);

  return (
    <ol ref={listRef} className="space-y-0.5">
      {group(headings).map(({ heading, children }) => {
        const inSection = heading.id === active || children.some((c) => c.id === active);
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => go(e, heading.id)}
              aria-current={inSection ? 'location' : undefined}
              className={`group grid grid-cols-[1.75rem_1fr] gap-x-1 py-1.5 text-[14px] leading-snug transition-colors duration-200 ${
                inSection ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span className={`pt-px font-mono text-[11px] tabular ${inSection ? 'text-accent' : 'text-rule-strong group-hover:text-muted'}`}>
                {heading.number ?? '·'}
              </span>
              <span>{heading.title}</span>
            </a>
            {children.length > 0 && (
              <ol className="mb-2 ml-[1.75rem] border-l border-rule">
                {children.map((child) => {
                  const current = child.id === active;
                  return (
                    <li key={child.id}>
                      <a
                        href={`#${child.id}`}
                        onClick={(e) => go(e, child.id)}
                        aria-current={current ? 'location' : undefined}
                        className={`-ml-px block border-l py-1 pl-3 text-[13px] leading-snug transition-colors duration-200 ${
                          current ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
                        }`}
                      >
                        {child.title}
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}
