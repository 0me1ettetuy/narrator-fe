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

// The spine: each row takes the colour of the cover's left edge at that height
// (the cover's own edge carried round the side), shaded darker toward the back.
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
  cloth,
}: {
  image: HTMLImageElement | null;
  fallbackColor: string;
  title?: string;
  width: number;
  faceWidth: number;
  height: number;
  // A bound spine: the cover's edge still carried round the side, with grain, a
  // lettering style (the number picks one of CLOTH_STYLES, so
  // neighbours differ) and the author along the foot.
  cloth?: { author: string; variant: number };
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
      if (cloth) drawGrain(context, w, h);
    } else {
      context.fillStyle = `color-mix(in srgb, ${fallbackColor}, black 20%)`;
      context.fillRect(0, 0, w, h);
    }

    if (title && cloth) {
      drawClothTitle(context, title, cloth, isLight, w, h);
    } else if (title) {
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

    const shade = context.createLinearGradient(0, 0, w, 0);
    if (cloth) {
      // Rounded: both edges turn away into shadow, a soft light sits left of
      // centre, and a dark hinge groove runs down each side.
      shade.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      shade.addColorStop(0.15, 'rgba(0, 0, 0, 0.05)');
      shade.addColorStop(0.38, 'rgba(255, 255, 255, 0.12)');
      shade.addColorStop(0.7, 'rgba(0, 0, 0, 0.06)');
      shade.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      context.fillStyle = shade;
      context.fillRect(0, 0, w, h);
      context.fillStyle = 'rgba(0, 0, 0, 0.45)';
      context.fillRect(w * 0.06, 0, w * 0.02, h);
      context.fillRect(w * 0.92, 0, w * 0.02, h);
    } else {
      // Darker toward the back edge, where the spine turns away from the light.
      shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shade.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      context.fillStyle = shade;
      context.fillRect(0, 0, w, h);
    }
  }

  return textureOf(canvas);
}

// Fills the canvas with the colour of the front's left edge, row by row: a thin
// strip of the cover (the part the front shows, same crop) squeezed to one pixel
// wide, then stretched across. Returns whether that colour is mostly light.
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
  context.imageSmoothingEnabled = true;
  context.drawImage(edge, 0, 0, width, height);
  try {
    const { data } = edgeContext.getImageData(0, 0, 1, EDGE_ROWS);
    let sum = 0;
    for (let index = 0; index < data.length; index += 4) {
      sum +=
        0.2126 * data[index] +
        0.7152 * data[index + 1] +
        0.0722 * data[index + 2];
    }

    return sum / EDGE_ROWS / 255 > 0.5;
  } catch {
    // Tainted canvas: keep the light title.
    return false;
  }
}

// A fine grain over the spine, so it is not a flat smear (same grain every time).
function drawGrain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  let seed = 7;
  for (let n = 0; n < (width * height) / 12; n += 1) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % width;
    seed = (seed * 16807) % 2147483647;
    const y = seed % height;
    context.fillStyle =
      n % 2 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.07)';
    context.fillRect(x, y, 1.5, 1.5);
  }
}

// Four ways a cloth spine is lettered; the book's variant picks one.
const CLOTH_STYLES = ['classic', 'label', 'sans', 'gilt'] as const;
const GILT = '#d9bc78';
const GILT_ON_LIGHT = '#8a6d2f';

function drawBands(
  context: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
  shares: number[],
  thickness = 0.006,
) {
  context.fillStyle = color;
  for (const share of shares) {
    context.fillRect(
      0,
      height * share - (height * thickness) / 2,
      width,
      height * thickness,
    );
  }
}

// The title (and, on some styles, the author) on a cloth spine, in the style
// the book's variant picks: serif with thin bands, a paper label, spaced sans
// capitals with the author at the foot, or gilt italic with double bands. Text
// runs down the spine, a quarter turn clockwise.
function drawClothTitle(
  context: CanvasRenderingContext2D,
  title: string,
  { author, variant }: { author: string; variant: number },
  isLight: boolean,
  w: number,
  h: number,
) {
  const style = CLOTH_STYLES[variant % CLOTH_STYLES.length];
  const tone = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  const ink = isLight ? DARK_INK : 'rgba(243, 240, 232, 0.9)';
  const hasAuthor = style === 'sans';
  const top = h * 0.1;
  const run = h * (hasAuthor ? 0.64 : 0.8);

  if (style === 'classic')
    drawBands(context, tone, w, h, [0.05, 0.07, 0.93, 0.95]);
  if (style === 'sans') drawBands(context, tone, w, h, [0.06, 0.94], 0.004);
  if (style === 'gilt') {
    drawBands(
      context,
      isLight ? GILT_ON_LIGHT : GILT,
      w,
      h,
      [0.05, 0.07, 0.93, 0.95],
      0.005,
    );
  }

  const lettering = {
    classic: { font: 'Georgia, serif', weight: '', share: 0.42, color: ink },
    label: { font: 'Georgia, serif', weight: '', share: 0.38, color: DARK_INK },
    sans: {
      font: "'Helvetica Neue', Arial, sans-serif",
      weight: '700 ',
      share: 0.34,
      color: ink,
    },
    gilt: {
      font: 'Georgia, serif',
      weight: 'italic ',
      share: 0.42,
      color: isLight ? GILT_ON_LIGHT : GILT,
    },
  }[style];
  const text = style === 'sans' ? title.toUpperCase() : title;

  context.save();
  context.translate(w / 2, top);
  context.rotate(Math.PI / 2);
  context.textBaseline = 'middle';
  let size = w * lettering.share;
  const setFont = () => {
    context.font = `${lettering.weight}${size}px ${lettering.font}`;
  };
  setFont();
  if (style === 'sans') context.letterSpacing = `${size * 0.12}px`;
  while (
    size > w * (style === 'sans' ? 0.16 : 0.24) &&
    context.measureText(text).width > run
  ) {
    size *= 0.93;
    setFont();
  }
  const shown = fitText(context, text, run);
  if (style === 'label') {
    // The paper label sits behind the title, a little wider than the text.
    const length = context.measureText(shown).width + w * 0.3;
    context.fillStyle = PAPER;
    context.fillRect(-w * 0.15, -w * 0.36, length, w * 0.72);
    context.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    context.lineWidth = w * 0.015;
    context.strokeRect(-w * 0.15, -w * 0.36, length, w * 0.72);
  }
  context.fillStyle = lettering.color;
  context.fillText(shown, 0, 0);
  if (hasAuthor) {
    context.letterSpacing = '0px';
    context.font = `${size * 0.7}px ${lettering.font}`;
    context.textAlign = 'right';
    const surname = (author.trim().split(/\s+/).pop() ?? '').toUpperCase();
    context.fillText(fitText(context, surname, h * 0.2), h * 0.8, 0);
  }
  context.restore();
}
