import { CanvasTexture, SRGBColorSpace } from 'three';
import { sampleCoverBandColor } from '@/entities/book';

const SCALE = 4;
const ART_SHARE = 0.58;
// Title font sizes as a share of the book width, largest first.
const TITLE_SIZES = [0.13, 0.115, 0.1, 0.09];
const PAPER = '#f3f0e8';

// Draws a book's front face: the cover art on top and, below it, a band tinted
// from the cover with the author and title (the old cover tile, on the book).
// Without a cover image the whole face is the plain band.
export function drawBookFront({
  title,
  author,
  image,
  width,
  height,
  fallbackColor,
}: {
  title: string;
  author: string;
  image: HTMLImageElement | null;
  width: number;
  height: number;
  fallbackColor: string;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const context = canvas.getContext('2d');

  if (context) {
    const { width: w, height: h } = canvas;
    const band = image ? readBand(image) : null;
    const artHeight = image ? Math.round(h * ART_SHARE) : 0;
    const padding = w * 0.09;

    context.fillStyle = band?.background ?? fallbackColor;
    context.fillRect(0, 0, w, h);

    if (image) {
      // Crop to fill the art box, like object-cover.
      const scale = Math.max(
        w / image.naturalWidth,
        artHeight / image.naturalHeight,
      );
      const sw = w / scale;
      const sh = artHeight / scale;
      context.drawImage(
        image,
        (image.naturalWidth - sw) / 2,
        (image.naturalHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        w,
        artHeight,
      );
    }

    context.fillStyle = band?.color ?? PAPER;
    context.textBaseline = 'top';
    context.font = `600 ${w * 0.075}px system-ui, sans-serif`;
    context.fillText(
      fitText(context, author.toUpperCase(), w - padding * 2),
      padding,
      artHeight + padding,
    );
    // Shrink the title until it fits the band; only then cut it with "…".
    const titleTop = artHeight + padding * 2;
    const room = h - titleTop - padding * 0.6;
    let lines: string[] = [];
    let lineHeight = 0;
    for (const size of TITLE_SIZES) {
      context.font = `${w * size}px Georgia, 'Times New Roman', serif`;
      lineHeight = w * size * 1.15;
      const maxLines = Math.max(1, Math.floor(room / lineHeight));
      lines = wrapText(context, title, w - padding * 2, Infinity);
      if (lines.length <= maxLines) break;
      lines = wrapText(context, title, w - padding * 2, maxLines);
    }
    lines.forEach((line, index) =>
      context.fillText(line, padding, titleTop + index * lineHeight),
    );
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;

  return texture;
}

function readBand(image: HTMLImageElement) {
  try {
    return sampleCoverBandColor(image);
  } catch {
    // Tainted canvas or no 2d context: keep the default band.
    return null;
  }
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  let result = text;

  while (result.length > 1 && context.measureText(result).width > maxWidth) {
    result = result.slice(0, -1);
  }

  return result === text ? text : `${result.trimEnd()}…`;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const lines: string[] = [];
  let line = '';

  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;

    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  lines.push(line);

  return lines.length > maxLines
    ? [
        ...lines.slice(0, maxLines - 1),
        fitText(context, lines.slice(maxLines - 1).join(' '), maxWidth),
      ]
    : lines;
}
