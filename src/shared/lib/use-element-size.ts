import { useEffect, useRef, useState } from 'react';

// Tracks an element's content size in px (0 until it is measured).
export function useElementSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
