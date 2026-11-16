import { Canvas } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BOOK_W, Book3D, getBookHeight } from '@/entities/book';
import {
  booksControllerGetBookCoverAccessOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { useElementSize } from '@/shared/lib/use-element-size';

// Hover column around the book, as in the library shelf.
const CELL_W = 160;
// Room the resting pose needs above the book (the tilted top face) and beside
// it (thickness and turn), in base px.
const TILT_ROOM = 16;
const SIDE_ROOM = 56;
// Same space on every side whatever the book's height, in px.
const PADDING = 24;

// The picked book as one big 3D book (same look as the library shelf): hover
// turns it to face you. It fills its parent and scales with the free space.
// Lazy-loaded by the page: it pulls in three.js.
export default function BookShowcase({
  book,
  wordCount,
  statusLabel,
}: {
  book: BookSummaryResponseDto;
  // Undefined until the book's chapters have loaded.
  wordCount: number | undefined;
  // Shown on the book until it is parsed.
  statusLabel: string | null;
}) {
  const { t } = useTranslation();
  const [ref, { width, height }] = useElementSize();
  const [isActive, setIsActive] = useState(false);
  // Follows the cover once it has loaded.
  const [loadedHeight, setLoadedHeight] = useState<number | null>(null);
  const cover = useQuery({
    ...booksControllerGetBookCoverAccessOptions({ path: { bookId: book.id } }),
    enabled: book.hasCover,
    staleTime: 14 * 60 * 1_000,
  });
  const baseHeight = loadedHeight ?? getBookHeight(book.id);
  // Scale each book to fit the stage with the same padding, so short and tall
  // books leave the same space around them.
  const unit = Math.max(
    0.1,
    Math.min(
      (width - 2 * PADDING) / (BOOK_W + SIDE_ROOM),
      (height - 2 * PADDING) / (baseHeight + TILT_ROOM),
    ),
  );
  const bookHeight = baseHeight * unit;
  // Centred in the stage; the canvas origin is its centre, y up.
  const baseline = (height + bookHeight) / 2;
  const cellW = CELL_W * unit;
  const frontW = BOOK_W * unit;

  return (
    <div ref={ref} className="relative min-h-80 flex-1">
      {width > 0 && height > 0 && (
        <>
          <Canvas
            orthographic
            frameloop="demand"
            dpr={[1, 2]}
            camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Book3D
              bookId={book.id}
              title={book.title}
              author={
                book.authors.map((author) => author.name).join(', ') ||
                t('book.unknownAuthor')
              }
              coverUrl={cover.data?.coverUrl}
              wordCount={wordCount}
              x={0}
              y={height / 2 - baseline}
              unit={unit}
              isActive={isActive}
              isPending={book.parseStatus !== 'READY'}
              onHeight={setLoadedHeight}
            />
          </Canvas>
          <div
            role="img"
            aria-label={book.title}
            className="absolute"
            style={{
              left: (width - cellW) / 2,
              top: baseline - bookHeight,
              width: cellW,
              height: bookHeight,
            }}
            onPointerEnter={() => setIsActive(true)}
            onPointerLeave={() => setIsActive(false)}
          >
            {statusLabel && (
              <span
                className="absolute top-1.5 inline-flex h-5 items-center bg-card px-1.5 text-[10px] font-semibold tracking-[0.06em] text-destructive-text uppercase"
                style={{ left: (cellW - frontW) / 2 + 6 }}
              >
                {statusLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
