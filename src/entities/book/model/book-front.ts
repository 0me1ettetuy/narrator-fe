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
      const mode = cloth ? CLOTH_BACKGROUNDS[cloth.variant % 4] : 'smear';
      isLight =
        mode === 'smear'
          ? drawLeftEdge(context, image, faceWidth, height, w, h)
          : drawEdgeBlocks(context, image, faceWidth, height, w, h, mode);
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

// A thin strip of the cover along the front's left edge (the same crop the front
// shows) squeezed to one pixel wide and EDGE_ROWS tall, with its pixels (null
// when the canvas is tainted).
function readEdge(
  image: HTMLImageElement,
  faceWidth: number,
  faceHeight: number,
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
  edgeContext?.drawImage(
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
  let data: Uint8ClampedArray | null = null;
  try {
    data = edgeContext?.getImageData(0, 0, 1, EDGE_ROWS).data ?? null;
  } catch {
    // Tainted canvas: no pixels to read.
  }

  return { edge, data };
}

const lumaAt = (data: Uint8ClampedArray, index: number) =>
  (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) /
  255;

// Fills the canvas with the colour of the front's left edge, row by row: the
// edge strip stretched across. Returns whether that colour is mostly light.
function drawLeftEdge(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  faceWidth: number,
  faceHeight: number,
  width: number,
  height: number,
) {
  const { edge, data } = readEdge(image, faceWidth, faceHeight);
  context.imageSmoothingEnabled = true;
  context.drawImage(edge, 0, 0, width, height);
  if (!data) return false;
  let sum = 0;
  for (let index = 0; index < data.length; index += 4) {
    sum += lumaAt(data, index);
  }

  return sum / EDGE_ROWS > 0.5;
}

// The same edge, flattened into crisp colour: one cloth colour, runs of colour
// (a block per stretch of the edge that keeps one colour) or two tones, the
// commonest colour on top and the next one below. Returns whether the colour
// under the title is mostly light.
function drawEdgeBlocks(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  faceWidth: number,
  faceHeight: number,
  width: number,
  height: number,
  mode: 'solid' | 'blocks' | 'twotone',
) {
  const { data } = readEdge(image, faceWidth, faceHeight);
  if (!data) {
    context.fillStyle = '#2b2b2b';
    context.fillRect(0, 0, width, height);
    return false;
  }
  type Rgb = [number, number, number];
  const rowColor = (row: number): Rgb => [
    data[row * 4],
    data[row * 4 + 1],
    data[row * 4 + 2],
  ];
  const distance = (x: Rgb, y: Rgb) =>
    Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  const average = (from: number, to: number): Rgb => {
    const sum: Rgb = [0, 0, 0];
    for (let row = from; row < to; row += 1) {
      const color = rowColor(row);
      sum[0] += color[0];
      sum[1] += color[1];
      sum[2] += color[2];
    }

    return sum.map((value) => Math.round(value / (to - from))) as Rgb;
  };
  const css = (color: Rgb) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  const isLightColor = (color: Rgb) =>
    (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255 > 0.5;

  // Runs: a new block starts where the edge moves away from the block's colour;
  // blocks under 4 rows join the one before.
  const runs: { from: number; to: number; color: Rgb }[] = [];
  for (let row = 0; row < EDGE_ROWS; row += 1) {
    const last = runs[runs.length - 1];
    if (last && distance(rowColor(row), last.color) < 70) {
      last.to = row + 1;
      last.color = average(last.from, last.to);
    } else {
      runs.push({ from: row, to: row + 1, color: rowColor(row) });
    }
  }
  const merged: typeof runs = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && run.to - run.from < 4) {
      last.to = run.to;
    } else {
      merged.push({ ...run });
    }
  }
  // The commonest colour, near black counting for a quarter (many covers carry a
  // black band), and the next one that differs from it.
  const ranked = [...merged]
    .map((run) => ({
      color: average(run.from, run.to),
      weight:
        (run.to - run.from) * (lumaAt(data, run.from * 4) < 0.15 ? 0.25 : 1),
    }))
    .sort((x, y) => y.weight - x.weight);
  const first = ranked[0].color;
  const second = ranked.find((entry) => distance(entry.color, first) > 90)
    ?.color ?? [20, 20, 20];

  const fill = (color: Rgb, from: number, to: number) => {
    context.fillStyle = css(color);
    context.fillRect(0, from * height, width, (to - from) * height + 1);
  };
  let underTitle = first;
  if (mode === 'solid') {
    fill(first, 0, 1);
  } else if (mode === 'twotone') {
    fill(first, 0, 0.68);
    fill(second, 0.68, 1);
  } else {
    for (const run of merged.slice(0, 7)) {
      fill(average(run.from, run.to), run.from / EDGE_ROWS, run.to / EDGE_ROWS);
    }
    const middle = merged.find((run) => run.to > EDGE_ROWS * 0.4) ?? merged[0];
    underTitle = average(middle.from, middle.to);
  }

  return isLightColor(underTitle);
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

// How a hero spine is coloured: the cover's edge stretched as it is, or flattened
// to crisp colour.
const CLOTH_BACKGROUNDS = ['smear', 'blocks', 'solid', 'twotone'] as const;

// Five ways a spine is lettered; the book's variant picks one.
const CLOTH_STYLES = ['classic', 'label', 'sans', 'gilt', 'poster'] as const;
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
  // The background takes variant % 4, the lettering the next digits, and some
  // books read bottom to top.
  const style = CLOTH_STYLES[Math.floor(variant / 4) % CLOTH_STYLES.length];
  const isFlipped = Math.floor(variant / 20) % 3 === 0;
  const tone = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  const ink = isLight ? DARK_INK : 'rgba(243, 240, 232, 0.9)';
  const hasAuthor = style === 'sans';
  const top = h * 0.1;
  const run = h * (hasAuthor ? 0.56 : 0.8);

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
    poster: {
      font: "'Helvetica Neue', Arial, sans-serif",
      weight: '800 ',
      share: 0.62,
      color: ink,
    },
    gilt: {
      font: 'Georgia, serif',
      weight: 'italic ',
      share: 0.42,
      color: isLight ? GILT_ON_LIGHT : GILT,
    },
  }[style];
  const text =
    style === 'sans' || style === 'poster' ? title.toUpperCase() : title;

  context.save();
  context.translate(w / 2, isFlipped ? h - top : top);
  context.rotate(isFlipped ? -Math.PI / 2 : Math.PI / 2);
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
  // A soft halo keeps the letters readable over the stripes behind them.
  if (style !== 'label') {
    context.shadowColor = isLight
      ? 'rgba(255, 255, 255, 0.7)'
      : 'rgba(0, 0, 0, 0.8)';
    context.shadowBlur = w * 0.12;
  }
  context.fillStyle = lettering.color;
  context.fillText(shown, 0, 0);
  if (hasAuthor) {
    context.letterSpacing = '0px';
    context.font = `${size * 0.5}px ${lettering.font}`;
    context.textAlign = 'right';
    const surname = (author.trim().split(/\s+/).pop() ?? '').toUpperCase();
    context.fillText(fitText(context, surname, h * 0.16), h * 0.8, 0);
  }
  context.restore();
}
