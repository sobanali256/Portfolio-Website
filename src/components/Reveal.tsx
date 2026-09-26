import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li';
}

// Scroll-reveal: a short rise and fade, once. MotionConfig reducedMotion="user"
// in App turns the transform off for visitors who ask for less motion.
export default function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const Component = as === 'li' ? motion.li : motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}
