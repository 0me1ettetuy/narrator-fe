import { useEffect, useState } from 'react';

export type CoverColor = { background: string; color: string };

const INK = '#191918';
const PAPER = '#f3f0e8';
const SAMPLE_WIDTH = 64;
// Art is shown in a 4:3 box with object-cover; its bottom edge is what the band
// below should blend into.
const ART_ASPECT = 4 / 3;

function sampleBandColor(img: HTMLImageElement): CoverColor {
  const aspect = img.naturalWidth / img.naturalHeight;
  const height = Math.max(8, Math.round(SAMPLE_WIDTH / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas is not available');
  }

  context.drawImage(img, 0, 0, SAMPLE_WIDTH, height);
  // Portrait covers are cropped top and bottom to fit the art box.
  const visibleFraction = aspect < ART_ASPECT ? aspect / ART_ASPECT : 1;
  const edge = Math.round(height * (0.5 + visibleFraction / 2));
  const top = Math.max(0, edge - 3);
  const { data } = context.getImageData(
    0,
    top,
    SAMPLE_WIDTH,
    Math.max(1, edge - top),
  );
  let red = 0;
  let green = 0;
  let blue = 0;
  const pixels = data.length / 4;

  for (let index = 0; index < data.length; index += 4) {
    red += data[index];
    green += data[index + 1];
    blue += data[index + 2];
  }

  red = Math.round(red / pixels);
  green = Math.round(green / pixels);
  blue = Math.round(blue / pixels);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return {
    background: `rgb(${red} ${green} ${blue})`,
    color: luminance > 0.55 ? INK : PAPER,
  };
}

// Band colour inferred from the cover image. Loads the image a second time with
// CORS so the pixels are readable; if the host sends no CORS headers the load
// fails and the caller keeps the default ink band.
export function useCoverColor(url: string | undefined): CoverColor | null {
  const [state, setState] = useState<{
    url: string;
    color: CoverColor;
  } | null>(null);

  useEffect(() => {
    if (!url) {
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) {
        return;
      }

      try {
        setState({ url, color: sampleBandColor(img) });
      } catch {
        // Tainted canvas or no 2d context: keep the default band.
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state !== null && state.url === url ? state.color : null;
}
