import { useEffect, useState } from 'react';

// Base size of a 3D book (px); callers scale it with `unit`.
export const BOOK_W = 128;
export const BOOK_H = 190;
// Resting pose: leaning back a little and turned to show the spine.
export const TILT_X = 0.2;
export const TURN_Y = 0.32;

export function getBookHeight(id: string) {
  return BOOK_H + (hashString(id) % 5) * 10;
}

// Stable per-book pseudo-random number (FNV-1a plus a final mix, so similar ids
// still differ in every bit) for the shelf variety: height and spine colour.
export function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909) >>> 0;

  return (hash ^ (hash >>> 16)) >>> 0;
}

// Loads the cover image. Covers are already fetched with CORS for colour
// sampling, so canvas and WebGL may read them; a failed load keeps the plain book.
export function useCoverImage(url: string | undefined) {
  const [loaded, setLoaded] = useState<{
    url: string;
    image: HTMLImageElement;
  } | null>(null);

  useEffect(() => {
    if (!url) return;
    let isCancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!isCancelled) setLoaded({ url, image });
    };
    image.src = url;

    return () => {
      isCancelled = true;
    };
  }, [url]);

  return loaded && loaded.url === url ? loaded.image : null;
}
