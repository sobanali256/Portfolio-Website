import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { chapters, scrollToChapter } from '../data/chapters';
import useActiveSection from '../hooks/useActiveSection';

const chapterIds = chapters.map(c => c.id);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const activeSection = useActiveSection(chapterIds);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToChapter(id);
    setIsOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: (scrolled || isMobile) ? 0 : -100 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 h-14 z-50 glass-nav px-6 flex items-center justify-between"
      >
        <div className="font-mono text-text-hi text-sm tracking-widest">
          SOBAN ALI
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {chapters.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => handleLinkClick(e, link.id)}
              className="group relative flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors hover:text-accent-cyan"
            >
              <span className="text-accent-cyan opacity-60">{link.number}</span>
              <span className={activeSection === link.id ? 'text-accent-cyan' : 'text-text-lo'}>
                {link.name}
              </span>
              {activeSection === link.id && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 w-full h-[1px] bg-accent-cyan"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </a>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-text-hi z-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#0A0A0F] z-[999] flex flex-col items-center justify-center gap-8 p-6 overflow-y-auto hide-scrollbar"
          >
            {/* Close Button */}
            <button
              className="absolute top-4 right-6 text-text-hi"
              onClick={() => setIsOpen(false)}
            >
              <X size={24} />
            </button>

            {chapters.map((link, i) => (
              <motion.a
                key={link.id}
                href={`#${link.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={(e) => handleLinkClick(e, link.id)}
                className="flex items-center gap-4 font-mono text-lg md:text-xl uppercase tracking-[0.1em] md:tracking-[0.2em] text-center"
              >
                <span className="text-accent-cyan opacity-60">{link.number}</span>
                <span className="text-text-hi">{link.name}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
