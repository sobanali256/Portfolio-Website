import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { chapters, scrollToChapter } from '../data/chapters';
import { profile } from '../data/content';
import useActiveSection from '../hooks/useActiveSection';
import useTheme from '../hooks/useTheme';

const chapterIds = chapters.map((c) => c.id);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useActiveSection(chapterIds);
  const lenis = useLenis();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock page scroll behind the mobile menu.
  useEffect(() => {
    if (isOpen) lenis?.stop();
    else lenis?.start();
    document.body.style.overflow = isOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, lenis]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsOpen(false);
    // Let the menu close (and Lenis restart) before scrolling.
    requestAnimationFrame(() => scrollToChapter(id, lenis));
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-[background-color,border-color] duration-300 ${
          scrolled || isOpen ? 'border-b border-rule bg-paper/85 backdrop-blur-md' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <a
            href="#top"
            onClick={(e) => go(e, 'top')}
            className="group flex items-baseline gap-2 font-display text-[1.45rem] leading-none text-ink"
          >
            <span className="italic">{profile.name}</span>
            <span aria-hidden="true" className="inline-block size-1.5 translate-y-[-2px] bg-accent transition-transform duration-300 group-hover:rotate-45" />
          </a>

          <div className="flex items-center gap-1 sm:gap-2">
            <ul className="hidden items-center md:flex">
              {chapters.map((link) => {
                const active = activeSection === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={(e) => go(e, link.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`group flex items-baseline gap-1.5 px-3 py-2 text-[13.5px] transition-colors duration-200 ${
                        active ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      <span className={`font-mono text-[10px] tabular ${active ? 'text-accent' : 'text-rule-strong group-hover:text-muted'}`}>
                        {link.number}
                      </span>
                      <span className="relative">
                        {link.name}
                        {active && (
                          <motion.span
                            layoutId="nav-underline"
                            className="absolute -bottom-1 left-0 h-px w-full bg-ink"
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="grid size-10 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-2 hover:text-ink"
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={1.6} /> : <Moon size={17} strokeWidth={1.6} />}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((o) => !o)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-[13.5px] text-ink transition-colors hover:bg-paper-2 md:hidden"
            >
              <span>{isOpen ? 'Close' : 'Menu'}</span>
              <span aria-hidden="true" className="relative block h-2.5 w-4">
                <span className={`absolute left-0 h-px w-full bg-current transition-transform duration-300 ${isOpen ? 'top-1/2 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 h-px w-full bg-current transition-transform duration-300 ${isOpen ? 'top-1/2 -rotate-45' : 'bottom-0'}`} />
              </span>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-16 z-40 flex flex-col justify-between overflow-y-auto bg-paper px-5 pb-10 pt-8 md:hidden"
          >
            <ul className="border-t border-rule">
              {chapters.map((link, i) => (
                <motion.li
                  key={link.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-rule"
                >
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => go(e, link.id)}
                    className="flex items-baseline justify-between py-4"
                  >
                    <span className="font-display text-[2.4rem] leading-none text-ink">{link.name}</span>
                    <span className="font-mono text-xs text-accent tabular">{link.number}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="mt-10 space-y-1 text-sm">
              <a href={`mailto:${profile.email}`} className="block text-ink">{profile.email}</a>
              <p className="text-muted">{profile.availability}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
