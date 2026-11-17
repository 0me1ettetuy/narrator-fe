import { Canvas } from '@react-three/fiber';
import { useState } from 'react';
import {
  Book3D,
  SHELF_GAP_Y,
  SHELF_INSET,
  getShelfLayout,
  hashString,
} from '@/entities/book';
import { TopLeftAnchor } from '@/shared/lib/top-left-anchor';
import { useElementSize } from '@/shared/lib/use-element-size';
import { HERO_BOOKS, getHeroCoverUrl } from '../model/hero-books';

// Space above and below the shelf, in px.
const PADDING = 24;
// Smallest book scale (1 = the library's) at which the shelf takes two rows.
const MIN_TWO_ROW_UNIT = 0.75;

// The landing page's books standing on a shelf like the library's (3D, the
// cover as the front face); a hovered book turns to face you. It fills its
// parent and shows as many books as fit it. Lazy-loaded by the page: it pulls
// in three.js.
export default function HeroShelf() {
  const [ref, { width, height }] = useElementSize();
  const [activeIsbn, setActiveIsbn] = useState<string | null>(null);
  // Two rows when the books can stay legible in them, otherwise one row that
  // shrinks to fit.
  const free = height - 2 * PADDING;
  const twoRows = getShelfLayout(width, (free - SHELF_GAP_Y) / 2);
  const rows = twoRows.unit >= MIN_TWO_ROW_UNIT ? 2 : 1;
  const { columns, cellW, unit, areaH, cellH, cellAt } =
    rows === 2 ? twoRows : getShelfLayout(width, free);
  const books = HERO_BOOKS.slice(0, columns * rows);
  // The rows that fit are centred in the free height.
  const top = (height - (rows * cellH + (rows - 1) * SHELF_GAP_Y)) / 2;

  return (
    <div ref={ref} className="absolute inset-0">
      {width > 0 && height > 0 && (
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
                    key={book.isbn}
                    bookId={book.isbn}
                    title={book.title}
                    author={book.author}
                    coverUrl={getHeroCoverUrl(book.isbn)}
                    // No real word count: a stable one gives each book its thickness.
                    wordCount={hashString(book.isbn) % 300_000}
                    x={cell.left + cellW / 2}
                    y={-(top + cell.top + areaH - SHELF_INSET)}
                    unit={unit}
                    isActive={activeIsbn === book.isbn}
                  />
                );
              })}
            </TopLeftAnchor>
          </Canvas>
          {/* The hover areas: the cell column each book stands in. */}
          {books.map((book, index) => {
            const cell = cellAt(index);

            return (
              <div
                key={book.isbn}
                className="absolute"
                style={{
                  left: cell.left,
                  top: top + cell.top,
                  width: cellW,
                  height: areaH,
                }}
                onPointerEnter={() => setActiveIsbn(book.isbn)}
                onPointerLeave={() =>
                  setActiveIsbn((current) =>
                    current === book.isbn ? null : current,
                  )
                }
              />
            );
          })}
        </>
      )}
    </div>
  );
}
