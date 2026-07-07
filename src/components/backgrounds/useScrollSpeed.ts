import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import type { HyperspeedHandle } from './Hyperspeed';

// Maps Lenis's per-frame scroll velocity onto Hyperspeed's -1..1 signed boost range
// (negative = scrolling up, reversing the tunnel), smoothed with a GSAP quickTo so
// rapid scroll events don't spawn overlapping tweens. VELOCITY_NORM is a
// tuned-by-eye divisor, not a physical unit conversion.
const VELOCITY_NORM = 40;

export function useScrollSpeed(hyperspeedRef: React.RefObject<HyperspeedHandle | null>) {
  const quickBoost = useRef<((value: number) => void) | null>(null);

  useEffect(() => {
    const state = { value: 0 };
    quickBoost.current = gsap.quickTo(state, 'value', {
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => hyperspeedRef.current?.setBoost(state.value)
    });
  }, [hyperspeedRef]);

  useLenis((lenis) => {
    const normalized = Math.max(-1, Math.min(1, lenis.velocity / VELOCITY_NORM));
    quickBoost.current?.(normalized);
  });
}
