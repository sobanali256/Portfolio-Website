import { motion } from 'motion/react';

interface ChapterTransitionProps {
  line: string;
  nextNumber: string;
}

export default function ChapterTransition({ line, nextNumber }: ChapterTransitionProps) {
  return (
    <div className="relative z-10 flex flex-col items-center py-20 px-6">
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-px h-16 origin-top bg-linear-to-b from-transparent via-accent-cyan/40 to-accent-cyan/60"
      />
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-accent-cyan my-3"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-vio">
          → Chapter {nextNumber}
        </span>
        <p className="font-body italic text-text-lo text-sm md:text-base max-w-md">
          {line}
        </p>
      </motion.div>
    </div>
  );
}
