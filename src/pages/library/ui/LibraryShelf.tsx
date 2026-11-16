import { Canvas, useThree } from '@react-three/fiber';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BOOK_W, Book3D, getBookHeight } from '@/entities/book';
import { PlayBookButton } from '@/features/audio-player';
import { type LibraryBookSummaryResponseDto } from '@/shared/api';
import { useElementSize } from '@/shared/lib/use-element-size';
import { cn } from '@/shared/lib/utils';
import { tileButtonClass } from '@/shared/ui/tile-actions';
import { BookActionsMenu } from '@/widgets/book-actions-menu';
import { getStatusLabel } from '../model/book-status';
import { RemoveFromLibraryButton } from './LibraryBooks';
import { LibraryShelfSkeleton } from './LibraryShelfSkeleton';

// Pixel layout shared by the canvas (books) and the DOM (actions), so both agree
// on where each cell is. The canvas camera is orthographic: 1 world unit = 1px.
// Base sizes; the shelf scales them so up to seven books fill a row.
const CELL_W = 160;
const MIN_CELL_W = 120;
const MAX_COLUMNS = 7;
const BOOK_AREA_H = 270;
const SHELF_INSET = 6;
const GAP_X = 8;
const GAP_Y = 24;

// The library as 3D books standing on shelves (react-three-fiber): the cover is
// the front face and the word count sets the thickness. A hovered book turns
// to face you and its actions (real DOM buttons) fade in at its top right corner.
export function LibraryShelf({
  books,
}: {
  books: LibraryBookSummaryResponseDto[];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [ref, { width }] = useElementSize();
  // The book under the pointer (or its buttons), and the one whose turn has
  // finished: its buttons show only then. The leave delay lets the pointer move
  // from the canvas onto the buttons without the book turning back.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settledId, setSettledId] = useState<string | null>(null);
  // Each book's height, which follows its cover once that has loaded.
  const [heights, setHeights] = useState<Record<string, number>>({});
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);
  // A closed menu or dialog can swallow the pointerleave, which would leave the
  // book turned: any move away from the active book (with no menu open on it) resets it.
  useEffect(() => {
    if (!activeId) return;
    function onMove(event: PointerEvent) {
      const shelfBook = document.querySelector(`[data-shelf-id="${activeId}"]`);
      // Over another book, its own pointerenter takes over.
      if (
        event.target instanceof Element &&
        !event.target.closest('[data-shelf-id]') &&
        !shelfBook?.querySelector('[data-popup-open]')
      ) {
        setActiveId(null);
      }
    }
    document.addEventListener('pointermove', onMove);
    return () => document.removeEventListener('pointermove', onMove);
  }, [activeId]);
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
    <div
      ref={ref}
      className="relative"
      style={{ height: width ? height : undefined }}
    >
      {/* Until the row is measured, keep the loading skeleton instead of a blank gap. */}
      {width === 0 && <LibraryShelfSkeleton />}
      {width > 0 && (
        <>
          <Canvas
            orthographic
            frameloop="demand"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <TopLeftAnchor>
              {books.map((book, index) => {
                const cell = cellAt(index);

                return (
                  <Book3D
                    key={book.id}
                    bookId={book.id}
                    title={book.title}
                    coverUrl={book.coverUrl ?? undefined}
                    wordCount={book.wordCount}
                    author={
                      book.authors.map((author) => author.name).join(', ') ||
                      t('book.unknownAuthor')
                    }
                    // From the canvas's top left corner, y up; the book stands on the shelf line.
                    x={cell.left + cellW / 2}
                    y={-(cell.top + areaH - SHELF_INSET)}
                    unit={unit}
                    isActive={activeId === book.id}
                    isPending={book.parseStatus !== 'READY'}
                    onHeight={(value) =>
                      setHeights((current) =>
                        current[book.id] === value
                          ? current
                          : { ...current, [book.id]: value },
                      )
                    }
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
            </TopLeftAnchor>
          </Canvas>
          {books.map((book, index) => {
            const cell = cellAt(index);
            const bookHeight =
              (heights[book.id] ?? getBookHeight(book.id)) * unit;

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

// Books are placed from the canvas's top left corner, not its centre. The canvas
// resizes a moment after the shelf grows (Load more), and centre-based positions
// would shift every book by half the change until it catches up.
function TopLeftAnchor({ children }: { children: React.ReactNode }) {
  const { width, height } = useThree((state) => state.size);

  return <group position={[-width / 2, height / 2, 0]}>{children}</group>;
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
  book: LibraryBookSummaryResponseDto;
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
      data-shelf-id={book.id}
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
            'absolute top-1.5 right-1.5 flex cursor-default gap-1 transition-opacity duration-150 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100 has-[[data-popup-open]]:pointer-events-auto has-[[data-popup-open]]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100',
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
