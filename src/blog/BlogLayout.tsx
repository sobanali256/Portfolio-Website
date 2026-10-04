import { useEffect, useState, type ReactNode } from 'react';
import { MotionConfig, motion, useScroll } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { useLenis } from 'lenis/react';
import { ArrowLeft, ArrowUp, Moon, Sun } from 'lucide-react';
import { scrollToChapter } from '../data/chapters';
import { profile } from '../data/content';
import useTheme from '../hooks/useTheme';

// Shared chrome for the blog pages (/blog and /blog/<slug>), matching the portfolio's
// navbar and colophon footer.

export const EASE = [0.16, 1, 0.3, 1] as const;
export const CONTAINER = 'mx-auto w-full max-w-[1320px] px-5 sm:px-8';
export const BLOG_HREF = '/blog';

export const Em = ({ children }: { children: ReactNode }) => <em className="italic text-accent">{children}</em>;

export function setMeta(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content);
}

// Which blog page is showing: the writing index or a post.
export type BlogPage = 'index' | 'post';

function BlogNav({ page, progress }: { page: BlogPage; progress: boolean }) {
  const { theme, toggle } = useTheme();
  const { scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-[background-color,border-color] duration-300 ${
        scrolled ? 'border-b border-rule bg-paper/85 backdrop-blur-md' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <a href="/" className="group flex items-baseline gap-2 font-display text-[1.45rem] leading-none text-ink">
          <span className="italic">{profile.name}</span>
          <span aria-hidden="true" className="inline-block size-1.5 translate-y-[-2px] bg-accent transition-transform duration-300 group-hover:rotate-45" />
        </a>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Both destinations are always one click away, so a post never needs two "backs" to reach the portfolio. */}
          <a
            href="/"
            className="group flex items-center gap-1.5 px-2.5 py-2 text-[13.5px] text-muted transition-colors duration-200 hover:text-ink sm:px-3"
          >
            <ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
            Portfolio
          </a>
          <a
            href={BLOG_HREF}
            aria-current={page === 'index' ? 'page' : undefined}
            className={`relative border-l border-rule px-2.5 py-1 text-[13.5px] transition-colors duration-200 sm:px-3 ${
              page === 'index' ? 'text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            Writing
            {page === 'index' && <span aria-hidden="true" className="absolute inset-x-2.5 -bottom-0.5 h-px bg-ink sm:inset-x-3" />}
          </a>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="grid size-10 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-2 hover:text-ink"
          >
            {theme === 'dark' ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
          </button>
        </div>
      </div>
      {progress && (
        <motion.div aria-hidden="true" style={{ scaleX: scrollYProgress }} className="absolute inset-x-0 -bottom-px h-px origin-left bg-accent" />
      )}
    </nav>
  );
}

function Footer() {
  const lenis = useLenis();
  return (
    <footer className="overflow-hidden border-t border-rule-strong">
      <div className={`${CONTAINER} grid gap-6 py-8 text-[13px] text-muted sm:grid-cols-2`}>
        <p>© {new Date().getFullYear()} {profile.name}</p>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToChapter('top', lenis);
          }}
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
  );
}

export function BlogShell({ page, progress = false, children }: { page: BlogPage; progress?: boolean; children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <BlogNav page={page} progress={progress} />
      <main id="main">{children}</main>
      <Footer />
      <Analytics />
    </MotionConfig>
  );
}
