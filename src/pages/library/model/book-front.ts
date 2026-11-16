import { CanvasTexture, SRGBColorSpace } from 'three';
import { sampleCoverBandColor } from '@/entities/book';

const SCALE = 4;
const ART_SHARE = 0.62;
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
    context.font = `${w * 0.13}px Georgia, 'Times New Roman', serif`;
    const lineHeight = w * 0.15;
    const maxLines = Math.max(
      1,
      Math.floor((h - artHeight - padding * 3) / lineHeight) - 1,
    );
    wrapText(context, title, w - padding * 2, maxLines).forEach((line, index) =>
      context.fillText(
        line,
        padding,
        artHeight + padding * 2 + index * lineHeight,
      ),
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
