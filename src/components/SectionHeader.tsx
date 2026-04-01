import { motion } from 'motion/react';

interface SectionHeaderProps {
  number: string;
  label: string;
  title: string;
  className?: string;
}

export default function SectionHeader({ number, label, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-16 ${className}`}>
      <div className="flex items-center justify-between border-b border-rule pb-4 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan"
        >
          <span className="opacity-50">{number} / </span>
          <span>{label}</span>
        </motion.div>
        <div className="hidden md:block w-24 h-px bg-rule/50" />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-[clamp(3.5rem,8vw,7rem)] font-display font-black text-text-hi uppercase tracking-tighter leading-[0.9]"
      >
        {title}
      </motion.h2>
    </div>
  );
}
