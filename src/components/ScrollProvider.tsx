import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { ReactNode, useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger);

// Lenis and GSAP each run their own rAF loop by default, which causes a 1-2 frame
// lag between smoothed scroll position and ScrollTrigger-driven animations.
// Disabling Lenis's autoRaf and driving it from gsap.ticker keeps both in lockstep.
function GsapTickerSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(update);
    };
  }, [lenis]);

  return null;
}

export default function ScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1 }}>
      <GsapTickerSync />
      {children}
    </ReactLenis>
  );
}
