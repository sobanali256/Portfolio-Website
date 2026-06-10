import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { chapters, scrollToChapter } from '../data/chapters';
import useActiveSection from '../hooks/useActiveSection';

const chapterIds = chapters.map(c => c.id);

export default function ChapterProgress() {
  const activeSection = useActiveSection(chapterIds);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToChapter(id);
  };

  return (
    <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-5">
      {/* Reading-progress track */}
      <div className="relative w-px h-32 bg-rule overflow-hidden">
        <motion.div
          style={{ scaleY }}
          className="absolute inset-x-0 top-0 h-full bg-accent-cyan origin-top"
        />
      </div>

      {/* Chapter dots */}
      <div className="flex flex-col gap-4">
        {chapters.map((chapter) => {
          const isActive = activeSection === chapter.id;
          return (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              onClick={(e) => handleClick(e, chapter.id)}
              aria-label={`Chapter ${chapter.number} — ${chapter.name}`}
              className="group relative flex items-center justify-end"
            >
              <span
                className={`absolute right-5 whitespace-nowrap font-mono text-[8px] uppercase tracking-widest bg-bg-void/80 backdrop-blur-sm px-2 py-0.5 rounded transition-opacity duration-300 ${
                  isActive ? 'opacity-100 text-accent-cyan' : 'opacity-0 group-hover:opacity-100 text-text-lo'
                }`}
              >
                {chapter.number} {chapter.name}
              </span>
              <span
                className={`block w-2 h-2 rounded-full border transition-all duration-300 ${
                  isActive
                    ? 'bg-accent-cyan border-accent-cyan scale-125'
                    : 'border-rule group-hover:border-accent-cyan/60'
                }`}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
