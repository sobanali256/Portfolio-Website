import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { ReactNode, useEffect, useState } from 'react';

// Lenis smooth scroll. Runs on native scroll, so window.scrollY, native scroll
// events and motion's useScroll() all keep working. Disabled for reduced motion.
export default function ScrollProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.12 }}>
      {children}
    </ReactLenis>
  );
}
