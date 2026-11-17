import { CanvasTexture, SRGBColorSpace } from 'three';
import { sampleCoverBandColor } from './use-cover-color';

const SCALE = 4;
const ART_SHARE = 0.58;
// Title font sizes as a share of the book width, largest first.
const TITLE_SIZES = [0.13, 0.115, 0.1, 0.09];
const PAPER = '#f3f0e8';
// The tinted band with author and title under the cover art is off for now: the
// title is on the spine instead. A book without a cover still gets the band, as
// its whole face. Set to true to bring the band back.
const FRONT_BAND = false;
// Spine title colours: dark ink on a light spine, the paper colour on a dark one.
const DARK_INK = '#1c1c1c';
// Rows sampled down the cover's left edge for the spine colour.
const EDGE_ROWS = 64;

// Draws a book's front face: the cover art filling it (with FRONT_BAND, art on top
// and, below it, a band tinted from the cover with the author and title, the old
// cover tile). Without a cover image the whole face is the plain band.
export function drawBookFront({
  title,
  author,
  image,
  width,
  height,
  fallbackColor,
  isBlank = false,
}: {
  title: string;
  author: string;
  image: HTMLImageElement | null;
  width: number;
  height: number;
  fallbackColor: string;
  // A plain face in the fallback colour: no band, author or title (a book still
  // being parsed).
  isBlank?: boolean;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const context = canvas.getContext('2d');

  if (context) {
    const { width: w, height: h } = canvas;
    const band = image ? readBand(image) : null;
    const showBand = FRONT_BAND || !image;
    const artHeight = image ? (FRONT_BAND ? Math.round(h * ART_SHARE) : h) : 0;
    const padding = w * 0.09;

    context.fillStyle = band?.background ?? fallbackColor;
    context.fillRect(0, 0, w, h);

    if (image) {
      // Crop to fill the art box, keeping the cover's top (usually its title).
      const scale = Math.max(
        w / image.naturalWidth,
        artHeight / image.naturalHeight,
      );
      const sw = w / scale;
      const sh = artHeight / scale;
      context.drawImage(
        image,
        (image.naturalWidth - sw) / 2,
        0,
        sw,
        sh,
        0,
        0,
        w,
        artHeight,
      );
    }

    if (!showBand || isBlank) return textureOf(canvas);

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

  return textureOf(canvas);
}

function textureOf(canvas: HTMLCanvasElement) {
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

// The spine: a flat cloth colour taken from the cover's left edge, shaded darker
// toward the back.
// With a title it is written along the spine, reading top to bottom. `width` is
// the book's thickness, `faceWidth` the front's width and `height` the height,
// in the same units as the front.
export function drawBookSide({
  image,
  fallbackColor,
  title,
  width,
  faceWidth,
  height,
}: {
  image: HTMLImageElement | null;
  fallbackColor: string;
  title?: string;
  width: number;
  faceWidth: number;
  height: number;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * SCALE);
  canvas.height = Math.round(height * SCALE);
  const context = canvas.getContext('2d');

  if (context) {
    const { width: w, height: h } = canvas;
    let isLight = false;
    if (image) {
      isLight = drawLeftEdge(context, image, faceWidth, height, w, h);
    } else {
      context.fillStyle = `color-mix(in srgb, ${fallbackColor}, black 20%)`;
      context.fillRect(0, 0, w, h);
    }

    if (title) {
      // Rotated a quarter turn clockwise: the text runs down the spine, centred
      // across it, shrunk to fit the length before it is cut with "…".
      const margin = w * 0.35;
      const run = h - margin * 2;
      context.save();
      context.translate(w / 2, margin);
      context.rotate(Math.PI / 2);
      context.fillStyle = isLight ? DARK_INK : PAPER;
      context.textBaseline = 'middle';
      let size = w * 0.5;
      context.font = `${size}px Georgia, 'Times New Roman', serif`;
      while (size > w * 0.3 && context.measureText(title).width > run) {
        size *= 0.93;
        context.font = `${size}px Georgia, 'Times New Roman', serif`;
      }
      context.fillText(fitText(context, title, run), 0, 0);
      context.restore();
    }

    // Darker toward the back edge, where the spine turns away from the light.
    const shade = context.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    context.fillStyle = shade;
    context.fillRect(0, 0, w, h);
  }

  return textureOf(canvas);
}

// Paints a cloth-bound spine: one flat colour, the commonest one down the front's
// left edge (the same crop the front shows), with two thin bands near each end
// and a soft highlight, so it reads as a bound book and not a smeared cover.
// Returns whether that colour is mostly light.
function drawLeftEdge(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  faceWidth: number,
  faceHeight: number,
  width: number,
  height: number,
) {
  const scale = Math.max(
    faceWidth / image.naturalWidth,
    faceHeight / image.naturalHeight,
  );
  const sw = faceWidth / scale;
  const sh = faceHeight / scale;
  const edge = document.createElement('canvas');
  edge.width = 1;
  edge.height = EDGE_ROWS;
  const edgeContext = edge.getContext('2d', { willReadFrequently: true });
  if (!edgeContext) return false;
  edgeContext.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    0,
    Math.max(1, sw * 0.02),
    sh,
    0,
    0,
    1,
    EDGE_ROWS,
  );
  let data: Uint8ClampedArray;
  try {
    data = edgeContext.getImageData(0, 0, 1, EDGE_ROWS).data;
  } catch {
    // Tainted canvas: a neutral dark spine with the light title.
    context.fillStyle = '#2b2b2b';
    context.fillRect(0, 0, width, height);
    return false;
  }
  // The commonest colour: rows grouped in 16-level buckets, the fullest bucket
  // averaged.
  const buckets = new Map<number, number[]>();
  for (let index = 0; index < data.length; index += 4) {
    const key =
      (data[index] >> 4) * 256 +
      (data[index + 1] >> 4) * 16 +
      (data[index + 2] >> 4);
    const rows = buckets.get(key) ?? [];
    rows.push(index);
    buckets.set(key, rows);
  }
  // Near black counts for a quarter: many covers carry a black band that would
  // otherwise make every spine black.
  const weight = (group: number[]) => {
    const i = group[0];
    const luma =
      (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;

    return group.length * (luma < 0.15 ? 0.25 : 1);
  };
  const rows = [...buckets.values()].sort((x, y) => weight(y) - weight(x))[0];
  const [r, g, b] = [0, 1, 2].map((channel) =>
    Math.round(
      rows.reduce((sum, index) => sum + data[index + channel], 0) / rows.length,
    ),
  );
  const isLight = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
  context.fillStyle = `rgb(${r}, ${g}, ${b})`;
  context.fillRect(0, 0, width, height);
  // Two thin bands at each end, a tone off the cloth.
  context.fillStyle = isLight
    ? 'rgba(0, 0, 0, 0.28)'
    : 'rgba(255, 255, 255, 0.3)';
  for (const share of [0.045, 0.065, 0.935, 0.955]) {
    context.fillRect(0, height * share - height * 0.004, width, height * 0.008);
  }
  // The rounded spine catches the light off centre.
  const round = context.createLinearGradient(0, 0, width, 0);
  round.addColorStop(0, 'rgba(255, 255, 255, 0)');
  round.addColorStop(0.3, 'rgba(255, 255, 255, 0.14)');
  round.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = round;
  context.fillRect(0, 0, width, height);

  return isLight;
}
