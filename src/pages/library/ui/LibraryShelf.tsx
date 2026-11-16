import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useQueries } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group } from 'three';
import { PlayBookButton } from '@/features/audio-player';
import {
  booksControllerGetBookCoverAccessOptions,
  booksControllerGetBookOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { tileButtonClass } from '@/shared/ui/tile-actions';
import { BookActionsMenu } from '@/widgets/book-actions-menu';
import { drawBookFront, drawBookSide } from '../model/book-front';
import { getStatusLabel } from '../model/book-status';
import { RemoveFromLibraryButton } from './LibraryBooks';

// Pixel layout shared by the canvas (books) and the DOM (labels), so both agree
// on where each cell is. The canvas camera is orthographic: 1 world unit = 1px.
// Base sizes; the shelf scales them so up to six books fill a row.
const CELL_W = 176;
const MIN_CELL_W = 130;
const MAX_COLUMNS = 6;
const BOOK_W = 128;
const BOOK_H = 176;
const BOOK_AREA_H = 250;
const SHELF_INSET = 6;
const LABEL_H = 32;
const GAP_X = 16;
const GAP_Y = 24;
// Resting pose: leaning back a little and turned to show the spine.
const TILT_X = 0.2;
const TURN_Y = 0.32;

// The library as 3D books standing on shelves (react-three-fiber): the cover is
// the front face and the word count sets the thickness. Titles, links and
// actions stay DOM under each book, so they are real links and buttons.
export function LibraryShelf({ books }: { books: BookSummaryResponseDto[] }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ref, width] = useElementWidth();
  const covers = useQueries({
    queries: books.map((book) => ({
      ...booksControllerGetBookCoverAccessOptions({
        path: { bookId: book.id },
      }),
      enabled: book.hasCover,
      staleTime: 14 * 60 * 1_000,
    })),
  });
  // The list has no word count, so thickness comes from each book's chapters;
  // these share the cache with the book page. shortcut: one request per ready
  // book, move to a `wordCount` on the list DTO once the backend has it.
  const details = useQueries({
    queries: books.map((book) => ({
      ...booksControllerGetBookOptions({ path: { bookId: book.id } }),
      enabled: book.parseStatus === 'READY',
      staleTime: 60 * 1_000,
    })),
  });
  const columns = Math.min(
    MAX_COLUMNS,
    Math.max(1, Math.floor((width + GAP_X) / (MIN_CELL_W + GAP_X))),
  );
  // Cells stretch to fill the row (up to a limit on phones); books scale with them.
  const cellW = Math.min(
    CELL_W * 1.25,
    (width - (columns - 1) * GAP_X) / columns,
  );
  const unit = cellW / CELL_W;
  const areaH = BOOK_AREA_H * unit;
  const cellH = areaH + SHELF_INSET * 2 + LABEL_H;
  const rows = Math.ceil(books.length / columns);
  const height = rows * cellH + (rows - 1) * GAP_Y;
  const offsetX = (width - (columns * cellW + (columns - 1) * GAP_X)) / 2;
  const cellAt = (index: number) => ({
    left: offsetX + (index % columns) * (cellW + GAP_X),
    top: Math.floor(index / columns) * (cellH + GAP_Y),
  });

  return (
    <div ref={ref} className="relative" style={{ height: width ? height : 0 }}>
      {width > 0 && (
        <>
          <Canvas
            orthographic
            frameloop="demand"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {books.map((book, index) => {
              const cell = cellAt(index);

              return (
                <ShelfBook
                  key={book.id}
                  book={book}
                  coverUrl={covers[index]?.data?.coverUrl}
                  wordCount={details[index]?.data?.chapters.reduce(
                    (sum, chapter) => sum + chapter.wordCount,
                    0,
                  )}
                  author={
                    book.authors.map((author) => author.name).join(', ') ||
                    t('book.unknownAuthor')
                  }
                  // Canvas origin is its center, y up; the book stands on the shelf line.
                  x={cell.left + cellW / 2 - width / 2}
                  y={height / 2 - (cell.top + areaH - SHELF_INSET)}
                  unit={unit}
                  onOpen={() =>
                    void navigate({
                      to: '/library/$bookId',
                      params: { bookId: book.id },
                    })
                  }
                />
              );
            })}
          </Canvas>
          {books.map((book, index) => {
            const cell = cellAt(index);

            return (
              <ShelfLabel
                key={book.id}
                book={book}
                style={{
                  left: cell.left,
                  top: cell.top + areaH + SHELF_INSET * 2,
                  width: cellW,
                  height: LABEL_H,
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// What stays DOM under a book: a link for keyboards and screen readers (the
// title is drawn on the 3D cover), the status and the actions.
function ShelfLabel({
  book,
  style,
}: {
  book: BookSummaryResponseDto;
  style: React.CSSProperties;
}) {
  const { t } = useTranslation();
  const statusLabel = getStatusLabel(book.parseStatus, t);

  return (
    <div className="absolute flex items-center gap-1" style={style}>
      <Link
        to="/library/$bookId"
        params={{ bookId: book.id }}
        title={book.title}
        className="sr-only focus-visible:not-sr-only focus-visible:max-w-20 focus-visible:truncate"
      >
        {t('library.openBook', { title: book.title })}
      </Link>
      {statusLabel && (
        <span className="text-[10px] font-semibold tracking-[0.06em] text-destructive-text uppercase">
          {statusLabel}
        </span>
      )}
      {book.hasReadyAudio && book.parseStatus === 'READY' && (
        <PlayBookButton bookId={book.id} iconOnly className={tileButtonClass} />
      )}
      {book.isOwner ? (
        <BookActionsMenu book={book} triggerClassName={tileButtonClass} />
      ) : (
        <RemoveFromLibraryButton bookId={book.id} bookTitle={book.title} />
      )}
    </div>
  );
}

const PAGES_COLOR = '#e6dfcb';
const PAGES_SHADE_COLOR = '#c9c2ad';

// One book standing on the shelf line at (x, y). Hover turns it to show the cover; a click opens it.
function ShelfBook({
  book,
  coverUrl,
  author,
  wordCount,
  x,
  y,
  unit,
  onOpen,
}: {
  book: BookSummaryResponseDto;
  coverUrl: string | undefined;
  author: string;
  // Undefined until the book's chapters have loaded.
  wordCount: number | undefined;
  x: number;
  y: number;
  // Scale of the whole book relative to the base size.
  unit: number;
  onOpen: () => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const image = useCoverImage(coverUrl);
  const hash = hashString(book.id);
  const height = BOOK_H + (hash % 4) * 12;
  const depth = Math.min(48, Math.max(18, 12 + (wordCount ?? 0) / 8_000));
  const bodyColor = `hsl(${hash % 360}, 25%, 30%)`;
  const title = book.title;
  const texture = useMemo(
    () =>
      drawBookFront({
        title,
        author,
        image,
        width: BOOK_W,
        height,
        fallbackColor: bodyColor,
      }),
    [title, author, image, height, bodyColor],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  const sideTexture = useMemo(
    () => drawBookSide({ image, fallbackColor: bodyColor }),
    [image, bodyColor],
  );
  useEffect(() => () => sideTexture.dispose(), [sideTexture]);
  const group = useRef<Group>(null);
  const hover = useRef({ target: 0, value: 0 });

  useFrame((state) => {
    const current = hover.current;
    current.value += (current.target - current.value) * 0.2;
    if (Math.abs(current.target - current.value) < 0.001) {
      current.value = current.target;
    } else {
      state.invalidate();
    }
    // Hover turns the book clockwise (seen from above) until the cover faces you.
    group.current?.position.set(0, height / 2, 0);
    group.current?.rotation.set(
      TILT_X * (1 - current.value),
      TURN_Y * (1 - current.value),
      0,
    );
  });

  function setHovered(isHovered: boolean) {
    hover.current.target = isHovered ? 1 : 0;
    document.body.style.cursor = isHovered ? 'pointer' : '';
    invalidate();
  }

  return (
    <group position={[x, y, 0]} scale={unit}>
      <group ref={group}>
        <mesh
          onClick={onOpen}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[BOOK_W, height, depth]} />
          {/* Box faces: right, left, top, bottom, front, back. */}
          <meshBasicMaterial attach="material-0" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-1" map={sideTexture} />
          <meshBasicMaterial attach="material-2" color={PAGES_COLOR} />
          <meshBasicMaterial attach="material-3" color={PAGES_SHADE_COLOR} />
          <meshBasicMaterial attach="material-4" map={texture} />
          <meshBasicMaterial attach="material-5" map={sideTexture} />
        </mesh>
      </group>
    </group>
  );
}

// Loads the cover image. Covers are already fetched with CORS for colour
// sampling, so canvas and WebGL may read them; a failed load keeps the plain book.
function useCoverImage(url: string | undefined) {
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

function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

// Stable per-book number for the shelf variety (height, spine colour).
function hashString(value: string) {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return hash;
}
