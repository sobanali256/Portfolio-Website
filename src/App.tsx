import React, { useState } from 'react';
import { MotionConfig, motion } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { ArrowDown, ArrowUpRight, ArrowUp, Check, Copy } from 'lucide-react';
import { useLenis } from 'lenis/react';
import Navbar from './components/Navbar';
import SectionHeader from './components/SectionHeader';
import ProjectIndex from './components/ProjectIndex';
import ContactForm from './components/ContactForm';
import PipelineFigure from './components/PipelineFigure';
import LocalTime from './components/LocalTime';
import Reveal from './components/Reveal';
import { scrollToChapter } from './data/chapters';
import { experiences, profile, projects, stack } from './data/content';
import portrait from './assets/portrait.webp';

const EASE = [0.16, 1, 0.3, 1] as const;
const CONTAINER = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8';

// Emphasis inside serif headings: italic, in the accent colour.
const Em = ({ children }: { children: React.ReactNode }) => <em className="italic text-accent">{children}</em>;

function Points({ points }: { points: string[] }) {
  return (
    <ul className="space-y-3">
      {points.map((pt) => (
        <li key={pt} className="relative pl-5 text-[16px] leading-[1.7]">
          <span aria-hidden="true" className="absolute left-0 top-[0.85em] h-px w-2.5 bg-rule-strong" />
          {pt}
        </li>
      ))}
    </ul>
  );
}

function CopyEmail({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Email address copied' : 'Copy email address'}
      className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-rule-strong text-ink transition-colors duration-200 hover:border-ink hover:bg-paper-2 ${className}`}
    >
      {copied ? <Check size={16} className="text-ok" /> : <Copy size={15} strokeWidth={1.7} />}
      <span role="status" className="sr-only">{copied ? 'Copied' : ''}</span>
    </button>
  );
}

export default function App() {
  const lenis = useLenis();
  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToChapter(id, lenis);
  };

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Navbar />

      <main id="main">
        {/* ——— Hero ——— */}
        <section id="top" className="relative overflow-hidden pb-14 pt-28 md:pb-20 md:pt-36">
          <div aria-hidden="true" className="ruled pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-60" />
          <div className={`${CONTAINER} relative`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
            >
              <p className="label">
                {profile.role} <span className="mx-1.5 text-rule-strong">/</span> {profile.location}{' '}
                <span className="mx-1.5 text-rule-strong">/</span> <LocalTime timeZone={profile.timeZone} /> PKT
              </p>
              <p className="inline-flex items-center gap-2.5 rounded-full border border-rule-strong bg-paper px-3.5 py-1.5 text-[13px] text-ink">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-50" />
                  <span className="relative size-2 rounded-full bg-accent" />
                </span>
                {profile.availability}
              </p>
            </motion.div>

            <div className="mt-12 grid gap-16 md:mt-16 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <h1 className="font-display text-[clamp(4.5rem,14vw,11.5rem)] leading-[0.86] tracking-[-0.025em] text-ink">
                  {['Soban', 'Ali'].map((word, i) => (
                    <span key={word} className="block overflow-hidden pb-[0.06em]">
                      <motion.span
                        className={`block ${i === 1 ? 'italic pl-[0.55em]' : ''}`}
                        initial={{ y: '105%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: EASE }}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
                  className="mt-10 max-w-[36ch] text-[clamp(1.2rem,1.75vw,1.45rem)] leading-[1.5] text-ink-2"
                >
                  I build AI systems — multi-agent pipelines, retrieval, vision models — and rebuild the research
                  behind them, chasing{' '}
                  <span className="font-display text-[1.14em] italic text-ink">why things work, not just that they work.</span>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
                  className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
                >
                  <a
                    href="#work"
                    onClick={(e) => go(e, 'work')}
                    className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-5 text-[15px] font-medium text-paper transition-colors duration-200 hover:bg-accent hover:text-accent-ink"
                  >
                    See selected work
                    <ArrowDown size={17} className="transition-transform duration-300 group-hover:translate-y-0.5" />
                  </a>
                  <span className="flex items-center gap-3">
                    <a href={`mailto:${profile.email}`} className="text-[15px] font-medium text-ink">
                      <span className="link-draw">{profile.email}</span>
                    </a>
                    <CopyEmail />
                  </span>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="lg:col-span-5 lg:pt-6"
              >
                <PipelineFigure />
              </motion.div>
            </div>

            <motion.dl
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="mt-20 grid border-t border-rule-strong sm:grid-cols-3 md:mt-24"
            >
              {[
                ['Now', 'AI Intern at Ledelsea — building an AI platform that writes and runs end-to-end tests.'],
                ['Recently', 'Ranked 117th of 1,980 teams worldwide in the Reply Code Challenge.'],
                ['Studying', 'B.S. Computer Science at FAST NUCES, CGPA 3.70, graduating June 2027.'],
              ].map(([k, v], i) => (
                <div key={k} className={`py-5 sm:pr-8 ${i > 0 ? 'border-t border-rule sm:border-l sm:border-t-0 sm:pl-8' : ''}`}>
                  <dt className="label mb-2">{k}</dt>
                  <dd className="text-[15px] leading-relaxed text-ink-2">{v}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        {/* ——— § 01 About ——— */}
        <section id="about" className="py-20 md:py-32">
          <div className={CONTAINER}>
            <SectionHeader
              number="01"
              name="About"
              title={<>Read deeply, rebuild carefully, <Em>then go further.</Em></>}
            />
            <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <Reveal>
                  <p className="text-[clamp(1.2rem,1.6vw,1.375rem)] leading-[1.6] text-ink">
                    I’m a final-year computer science student at FAST NUCES, graduating in June 2027 — and an AI
                    engineer in progress. From architecting multi-agent systems to implementing machine-learning
                    algorithms from scratch, I’m after theoretical depth and hands-on intuition in equal measure.
                  </p>
                </Reveal>
                <Reveal delay={0.05}>
                  <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.75]">
                    The project I’m proudest of so far: replicating a malware-detection research paper and pushing it
                    past the original benchmark. That kind of work — reading deeply, rebuilding carefully, then going
                    further — is exactly how I learn best.
                  </p>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-6 max-w-[62ch] text-[17px] leading-[1.75]">
                    I’m drawn to AI because the field moves fast and the stakes are real. I’d rather be one of the
                    people steering it than someone it leaves behind.
                  </p>
                </Reveal>

                <Reveal delay={0.1}>
                  <dl className="mt-12 grid grid-cols-2 gap-x-8 border-t border-rule md:grid-cols-4">
                    {[
                      ['Based in', 'Lahore, PK'],
                      ['Degree', 'B.S. CS, FAST'],
                      ['CGPA', '3.70'],
                      ['Graduating', 'June 2027'],
                    ].map(([k, v]) => (
                      <div key={k} className="border-b border-rule py-4 md:border-b-0">
                        <dt className="label mb-1.5">{k}</dt>
                        <dd className="text-[15px] text-ink tabular">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>

              <Reveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
                <figure>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[3px] bg-paper-2">
                    <div aria-hidden="true" className="ruled absolute inset-0 opacity-70" />
                    <img
                      src={portrait}
                      alt="Illustrated 3D portrait of Soban Ali in a navy blazer"
                      width={640}
                      height={962}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-x-0 bottom-0 mx-auto h-[94%] w-auto object-contain object-bottom"
                    />
                  </div>
                  <figcaption className="mt-3 flex justify-between gap-4 text-[13px] text-muted">
                    <span><span className="font-medium text-ink">Plate I</span> — The author, rendered.</span>
                    <span>Lahore, PK</span>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ——— § 02 Work ——— */}
        <section id="work" className="py-20 md:py-32">
          <div className={CONTAINER}>
            <SectionHeader
              number="02"
              name="Work"
              title={<>Selected work, <Em>with receipts.</Em></>}
              aside={`${projects.length} projects`}
            />
            <ProjectIndex projects={projects} />
            <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[15px] text-muted">Each build taught something the last one couldn’t.</p>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 text-[15px] font-medium text-ink"
              >
                <span className="link-draw">Everything else on GitHub</span>
                <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Reveal>
          </div>
        </section>

        {/* ——— § 03 Experience ——— */}
        <section id="experience" className="bg-paper-2 py-20 md:py-32">
          <div className={CONTAINER}>
            <SectionHeader number="03" name="Experience" title={<>Theory, meet <Em>production.</Em></>} />
            <ol>
              {experiences.map((exp, i) => (
                <Reveal
                  as="li"
                  key={exp.org}
                  delay={i * 0.05}
                  className="grid gap-x-10 gap-y-4 border-t border-rule-strong py-9 md:grid-cols-12 md:py-11"
                >
                  <p className="font-mono text-[12.5px] text-muted tabular md:col-span-3 md:pt-2">{exp.period}</p>
                  <div className="md:col-span-4">
                    <h3 className="font-display text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.08]">{exp.role}</h3>
                    <p className="mt-2 text-[15px] text-ink-2">
                      {exp.org} <span className="text-muted">· {exp.kind}</span>
                    </p>
                  </div>
                  <div className="md:col-span-5 md:pt-1.5">
                    {exp.points.length > 0 && <Points points={exp.points} />}
                    {exp.projects?.map((proj, j) => (
                      <div key={proj.name} className={j > 0 || exp.points.length > 0 ? 'mt-7 border-t border-rule pt-6' : ''}>
                        <p className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="font-display text-[1.3rem] leading-tight">{proj.name}</span>
                          <span className="font-mono text-[11.5px] text-muted tabular">{proj.period}</span>
                        </p>
                        <Points points={proj.points} />
                      </div>
                    ))}
                    {exp.stack.length > 0 && (
                      <p className="mt-5 font-mono text-[11.5px] text-muted">{exp.stack.join('  ·  ')}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ——— § 04 Stack ——— */}
        <section id="stack" className="py-20 md:py-32">
          <div className={CONTAINER}>
            <SectionHeader number="04" name="Stack" title={<>The tools, <Em>used in anger.</Em></>} />
            <dl>
              {stack.map((g, i) => (
                <Reveal
                  key={g.group}
                  delay={i * 0.04}
                  className="grid gap-x-10 gap-y-2 border-t border-rule py-6 md:grid-cols-12 md:py-7"
                >
                  <dt className="label md:col-span-3 md:pt-2">{g.group}</dt>
                  <dd className="text-[clamp(1.2rem,2vw,1.6rem)] leading-[1.45] text-ink md:col-span-9">
                    {g.items.map((item, j) => (
                      <React.Fragment key={item}>
                        <span className="whitespace-nowrap">{item}</span>
                        {j < g.items.length - 1 && <span aria-hidden="true" className="mx-1.5 text-rule-strong"> / </span>}
                      </React.Fragment>
                    ))}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* ——— § 05 Contact ——— */}
        <section id="contact" className="py-20 md:py-32">
          <div className={CONTAINER}>
            <SectionHeader number="05" name="Contact" title={<>Let’s build something <Em>worth doing well.</Em></>} />
            <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
              <Reveal className="lg:col-span-5">
                <p className="max-w-[44ch] text-[17px] leading-[1.75]">
                  Graduating June 2027 and looking for the right place to keep building. If you’re working on something
                  in AI worth doing well — a role, a research collaboration, a hard problem — I’d like to hear about it.
                  I read every message.
                </p>

                <div className="mt-10 flex items-center gap-3">
                  <a
                    href={`mailto:${profile.email}`}
                    className="min-w-0 break-all font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-tight text-ink"
                  >
                    <span className="link-draw">{profile.email}</span>
                  </a>
                  <CopyEmail />
                </div>

                <ul className="mt-10 border-t border-rule">
                  {[
                    ['LinkedIn', profile.linkedin, 'in/sobanali256'],
                    ['GitHub', profile.github, 'sobanali256'],
                  ].map(([name, href, handle]) => (
                    <li key={name} className="border-b border-rule">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between py-4 text-[15px]"
                      >
                        <span className="text-ink">{name}</span>
                        <span className="flex items-center gap-2 text-muted transition-colors group-hover:text-ink">
                          {handle}
                          <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[14px] text-muted">
                  It’s <LocalTime timeZone={profile.timeZone} /> in Lahore right now.
                </p>
              </Reveal>

              <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      {/* ——— Colophon ——— */}
      <footer className="overflow-hidden border-t border-rule-strong">
        <div className={`${CONTAINER} grid gap-6 py-8 text-[13px] text-muted sm:grid-cols-3`}>
          <p>© {new Date().getFullYear()} {profile.name}</p>
          <p className="sm:text-center">Set in Instrument Serif, Geist &amp; Geist Mono.</p>
          <a
            href="#top"
            onClick={(e) => go(e, 'top')}
            className="group inline-flex items-center gap-1.5 text-ink sm:justify-self-end"
          >
            <span className="link-draw">Back to top</span>
            <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <p
          aria-hidden="true"
          className="-mb-[0.22em] select-none whitespace-nowrap text-center font-display text-[clamp(5rem,21vw,20rem)] leading-none tracking-[-0.03em] text-ink/[0.07]"
        >
          Soban <span className="italic">Ali</span>
        </p>
      </footer>
      <Analytics />
    </MotionConfig>
  );
}
