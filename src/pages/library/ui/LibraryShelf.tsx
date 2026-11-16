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
import { cn } from '@/shared/lib/utils';
import { tileButtonClass } from '@/shared/ui/tile-actions';
import { BookActionsMenu } from '@/widgets/book-actions-menu';
import { drawBookFront, drawBookSide } from '../model/book-front';
import { getStatusLabel } from '../model/book-status';
import { RemoveFromLibraryButton } from './LibraryBooks';

// Pixel layout shared by the canvas (books) and the DOM (actions), so both agree
// on where each cell is. The canvas camera is orthographic: 1 world unit = 1px.
// Base sizes; the shelf scales them so up to seven books fill a row.
const CELL_W = 160;
const MIN_CELL_W = 120;
const MAX_COLUMNS = 7;
const BOOK_W = 128;
const BOOK_H = 160;
const BOOK_AREA_H = 270;
const SHELF_INSET = 6;
const GAP_X = 8;
const GAP_Y = 24;
// Resting pose: leaning back a little and turned to show the spine.
const TILT_X = 0.2;
const TURN_Y = 0.32;

// The library as 3D books standing on shelves (react-three-fiber): the cover is
// the front face and the word count sets the thickness. A hovered book turns
// to face you and its actions (real DOM buttons) fade in at its top right corner.
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
  // The book under the pointer (or its buttons), and the one whose turn has
  // finished: its buttons show only then. The leave delay lets the pointer move
  // from the canvas onto the buttons without the book turning back.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  function hover(id: string | null) {
    window.clearTimeout(leaveTimer.current);
    if (id) setActiveId(id);
    else leaveTimer.current = window.setTimeout(() => setActiveId(null), 150);
  }
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
  const cellH = areaH + SHELF_INSET;
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
                  isActive={activeId === book.id}
                  onSettled={(isSettled) =>
                    setSettledId((current) =>
                      isSettled
                        ? book.id
                        : current === book.id
                          ? null
                          : current,
                    )
                  }
                />
              );
            })}
          </Canvas>
          {books.map((book, index) => {
            const cell = cellAt(index);
            const bookHeight = getBookHeight(book.id) * unit;

            return (
              <ShelfActions
                key={book.id}
                book={book}
                isVisible={settledId === book.id}
                onHover={(isHovered) => hover(isHovered ? book.id : null)}
                onOpen={() =>
                  void navigate({
                    to: '/library/$bookId',
                    params: { bookId: book.id },
                  })
                }
                // The whole cell column the book stands in: the hover and click area.
                style={{
                  left: cell.left,
                  top: cell.top + areaH - SHELF_INSET - bookHeight,
                  width: cellW,
                  height: bookHeight,
                }}
                // Where the front face sits once the book has turned to face you.
                frontWidth={BOOK_W * unit}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// What stays DOM on a book, laid over its turned front face: a link for
// keyboards and screen readers (the title is drawn on the 3D cover), the status
// chip, and the actions, which fade in once the book has finished turning.
function ShelfActions({
  book,
  style,
  frontWidth,
  isVisible,
  onHover,
  onOpen,
}: {
  book: BookSummaryResponseDto;
  style: React.CSSProperties;
  frontWidth: number;
  isVisible: boolean;
  onHover: (isHovered: boolean) => void;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const statusLabel = getStatusLabel(book.parseStatus, t);

  return (
    // Hover and click are handled here in the DOM, not by canvas events: a canvas
    // raycast loses the book as soon as the pointer is over a button.
    <div
      className="pointer-events-auto absolute cursor-pointer"
      style={style}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpen();
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{
          left: (Number(style.width) - frontWidth) / 2,
          width: frontWidth,
        }}
      >
        <Link
          to="/library/$bookId"
          params={{ bookId: book.id }}
          title={book.title}
          className="sr-only focus-visible:not-sr-only focus-visible:pointer-events-auto focus-visible:absolute focus-visible:bottom-1.5 focus-visible:left-1.5 focus-visible:bg-card focus-visible:px-1.5 focus-visible:text-xs"
        >
          {t('library.openBook', { title: book.title })}
        </Link>
        {statusLabel && (
          <span
            className={cn(
              'absolute top-1.5 left-1.5 inline-flex h-5 items-center px-1.5 text-[10px] font-semibold tracking-[0.06em] uppercase',
              book.parseStatus === 'FAILED'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-card text-destructive-text',
            )}
          >
            {statusLabel}
          </span>
        )}
        <div
          className={cn(
            'absolute top-1.5 right-1.5 flex cursor-default gap-1 transition-opacity duration-150 focus-within:pointer-events-auto focus-within:opacity-100 has-[[data-popup-open]]:pointer-events-auto has-[[data-popup-open]]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100',
            isVisible
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0',
          )}
        >
          {book.hasReadyAudio && book.parseStatus === 'READY' && (
            <PlayBookButton
              bookId={book.id}
              iconOnly
              className={tileButtonClass}
            />
          )}
          {book.isOwner ? (
            <BookActionsMenu book={book} triggerClassName={tileButtonClass} />
          ) : (
            <RemoveFromLibraryButton bookId={book.id} bookTitle={book.title} />
          )}
        </div>
      </div>
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
  isActive,
  onSettled,
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
  // Driven by the parent's DOM hover (see ShelfActions), not by canvas events.
  isActive: boolean;
  // True once the turn to face you has finished, false as it starts to leave.
  onSettled: (isSettled: boolean) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const image = useCoverImage(coverUrl);
  const hash = hashString(book.id);
  const height = getBookHeight(book.id);
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
  const wasSettled = useRef(false);

  useEffect(() => {
    hover.current.target = isActive ? 1 : 0;
    invalidate();
  }, [isActive, invalidate]);

  useFrame((state) => {
    const current = hover.current;
    current.value += (current.target - current.value) * 0.2;
    if (Math.abs(current.target - current.value) < 0.001) {
      current.value = current.target;
    } else {
      state.invalidate();
    }
    const isSettled = current.target === 1 && current.value === 1;
    if (isSettled !== wasSettled.current) {
      wasSettled.current = isSettled;
      onSettled(isSettled);
    }
    // Hover turns the book clockwise (seen from above) until the cover faces you.
    group.current?.position.set(0, height / 2, 0);
    group.current?.rotation.set(
      TILT_X * (1 - current.value),
      TURN_Y * (1 - current.value),
      0,
    );
  });

  return (
    <group position={[x, y, 0]} scale={unit}>
      <group ref={group}>
        <mesh>
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

function getBookHeight(id: string) {
  return BOOK_H + (hashString(id) % 9) * 10;
}

// Stable per-book pseudo-random number (FNV-1a plus a final mix, so similar ids
// still differ in every bit) for the shelf variety: height and spine colour.
function hashString(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  }
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909) >>> 0;

  return (hash ^ (hash >>> 16)) >>> 0;
}
