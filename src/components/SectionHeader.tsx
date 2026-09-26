import type { ReactNode } from 'react';
import Reveal from './Reveal';

interface SectionHeaderProps {
  number: string;
  name: string;
  title: ReactNode;
  aside?: ReactNode;
}

// Running head for a section: a full-width rule, the "§ 02 — Work" marker, then the
// serif heading. Matches the numbering in data/chapters.ts.
export default function SectionHeader({ number, name, title, aside }: SectionHeaderProps) {
  return (
    <header className="mb-12 md:mb-16">
      <div className="flex items-center justify-between border-t border-rule-strong pt-4">
        <span className="label">
          <span className="text-accent">§ {number}</span>
          <span className="mx-2 text-rule-strong">—</span>
          {name}
        </span>
        {aside && <span className="label hidden sm:block">{aside}</span>}
      </div>
      <Reveal>
        <h2 className="mt-8 max-w-[18ch] font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02] tracking-[-0.01em]">
          {title}
        </h2>
      </Reveal>
    </header>
  );
}
