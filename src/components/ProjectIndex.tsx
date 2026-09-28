import { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { Project } from '../data/content';
import Reveal from './Reveal';

// The work section as an index rather than a card grid: one ruled row per project,
// headline metric on the right, details disclosed in place. Height animates via
// grid-template-rows (0fr → 1fr) so nothing but layout-free properties transition.
export default function ProjectIndex({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<string | null>(projects[0]?.id ?? null);

  return (
    <ol className="border-b border-rule">
      {projects.map((p, idx) => {
        const isOpen = open === p.id;
        const panelId = `project-${p.id}`;
        return (
          <Reveal as="li" key={p.id} delay={Math.min(idx, 5) * 0.05} className="border-t border-rule">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : p.id)}
                className="group grid w-full cursor-pointer grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3 py-6 text-left sm:grid-cols-[3rem_1fr_minmax(9rem,auto)_2.5rem] sm:gap-x-6 md:py-7"
              >
                <span className={`font-mono text-xs tabular transition-colors duration-200 ${isOpen ? 'text-accent' : 'text-muted group-hover:text-accent'}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0">
                  <span className="block font-display text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[1.05] text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5">
                    {p.title}
                  </span>
                  <span className="mt-2 block text-[15px] leading-relaxed text-muted">
                    <span className="text-ink-2">{p.kind}</span>
                    <span className="mx-2 text-rule-strong">/</span>
                    {p.summary}
                  </span>
                </span>

                <span className="hidden text-right sm:block">
                  <span className="block font-display text-[2rem] leading-none text-ink tabular">{p.metric.value}</span>
                  <span className="mt-1.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{p.metric.label}</span>
                </span>

                <span
                  aria-hidden="true"
                  className={`grid size-9 place-items-center self-center justify-self-end rounded-full border transition-all duration-300 ${
                    isOpen ? 'rotate-45 border-ink bg-ink text-paper' : 'border-rule-strong text-ink group-hover:border-ink'
                  }`}
                >
                  <Plus size={16} strokeWidth={1.6} />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-label={p.title}
              className={`grid transition-[grid-template-rows] duration-500 ease-out-expo ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <div className="grid gap-6 pb-8 pl-[calc(2.25rem+0.75rem)] sm:grid-cols-[1fr_minmax(9rem,auto)_2.5rem] sm:gap-x-6 sm:pl-[calc(3rem+1.5rem)]">
                  <div>
                    {/* Metric repeated here only on phones, where the row hides it. */}
                    <p className="mb-4 flex items-baseline gap-3 sm:hidden">
                      <span className="font-display text-3xl leading-none text-ink">{p.metric.value}</span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{p.metric.label}</span>
                    </p>
                    <p className="max-w-[62ch] text-[16px] leading-[1.7] text-ink-2">{p.detail}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <ul className="flex flex-wrap gap-1.5" aria-label="Built with">
                        {p.stack.map((s) => (
                          <li key={s} className="rounded-full border border-rule px-2.5 py-1 font-mono text-[11px] text-muted">
                            {s}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {[
                          ...(p.live ? [{ href: p.live, label: 'Live app' }] : []),
                          ...(p.href ? [{ href: p.href, label: 'Source on GitHub' }] : []),
                        ].map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link inline-flex items-center gap-1 text-[14px] font-medium text-ink"
                          >
                            <span className="link-draw">{link.label}</span>
                            <ArrowUpRight size={15} className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}
