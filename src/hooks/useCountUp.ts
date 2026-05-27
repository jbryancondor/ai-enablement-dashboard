import { useState, useEffect } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Returns the current animated value.
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
