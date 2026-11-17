import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
import { BOOK_W, Book3D, getBookDepth, hashString } from '@/entities/book';
import { TopLeftAnchor } from '@/shared/lib/top-left-anchor';
import { useElementSize } from '@/shared/lib/use-element-size';
import { HERO_BOOKS, getHeroCoverUrl } from '../model/hero-books';

// Space above and below the row of books, and at its sides (the page's own
// margin: 16 on phones, 32 from sm), in px.
const PADDING = 24;
// Between two spines, in px.
const GAP = 3;
// The tallest a book gets (base px, see `Book3D`) and the largest scale.
const TALLEST = 250;
const MAX_UNIT = 2.2;
// The thinnest a book gets (base px).
const THINNEST = 30;
// Share of the distance to its place a sliding book covers each frame.
const SLIDE = 0.18;

// There is no real word count: a stable one from the ISBN gives each book its
// own thickness.
function getWordCount(isbn: string) {
  return hashString(isbn) % 300_000;
}

// The landing page's books standing side by side on a shelf, spines to you. The
// one under the pointer turns to show its cover and the others make room for
// it. It fills its parent and shows as many books as fit its width. Lazy-loaded
// by the page: it pulls in three.js.
export default function HeroShelf() {
  const [ref, { width, height }] = useElementSize();
  const [activeIsbn, setActiveIsbn] = useState<string | null>(null);
  const unit = Math.max(
    0.1,
    Math.min(MAX_UNIT, (height - 2 * PADDING) / TALLEST),
  );
  const margin = width < 640 ? 16 : 32;
  // Leave room for the one open cover, so the row never runs off the screen.
  const room = width - 2 * margin - (BOOK_W - THINNEST) * unit;
  const shelf: {
    book: (typeof HERO_BOOKS)[number];
    w: number;
    left: number;
  }[] = [];
  let used = 0;
  for (const book of HERO_BOOKS) {
    const w = getBookDepth(getWordCount(book.isbn)) * unit;
    const next = used + (shelf.length ? GAP : 0);
    if (shelf.length && next + w > room) break;
    shelf.push({ book, w, left: next });
    used = next + w;
  }
  const start = (width - used) / 2;
  const open = shelf.findIndex((slot) => slot.book.isbn === activeIsbn);
  // The open book is as wide as a cover; the books on each side move apart by
  // half of what it gains, so the row stays centred.
  const extra = open >= 0 ? BOOK_W * unit - shelf[open].w : 0;
  const baseline = height - PADDING;

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
              {shelf.map(({ book, w, left }, index) => {
                const shift =
                  open < 0 || index === open
                    ? 0
                    : index < open
                      ? -extra / 2
                      : extra / 2;

                return (
                  <SlidingBook
                    key={book.isbn}
                    x={start + left + w / 2 + shift}
                    y={-baseline}
                    isActive={index === open}
                  >
                    <Book3D
                      bookId={book.isbn}
                      title={book.title}
                      author={book.author}
                      coverUrl={getHeroCoverUrl(book.isbn)}
                      wordCount={getWordCount(book.isbn)}
                      x={0}
                      y={0}
                      unit={unit}
                      isActive={index === open}
                      // A quarter turn about the vertical axis: spine to you.
                      restTilt={0}
                      restTurn={Math.PI / 2}
                    />
                  </SlidingBook>
                );
              })}
            </TopLeftAnchor>
          </Canvas>
          {/* The hover areas: each book's resting place, so they hold still
              while the books slide. A touch keeps the last book it opened. */}
          {shelf.map(({ book, w, left }) => (
            <div
              key={book.isbn}
              className="absolute"
              style={{
                left: start + left - GAP / 2,
                top: baseline - TALLEST * unit,
                width: w + GAP,
                height: TALLEST * unit,
              }}
              onPointerEnter={() => setActiveIsbn(book.isbn)}
              onPointerLeave={(event) => {
                if (event.pointerType === 'touch') return;
                setActiveIsbn((current) =>
                  current === book.isbn ? null : current,
                );
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

// Slides its book sideways to its place, in front of the others while open.
function SlidingBook({
  x,
  y,
  isActive,
  children,
}: {
  x: number;
  y: number;
  isActive: boolean;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const isPlaced = useRef(false);
  const invalidate = useThree((state) => state.invalidate);

  // The canvas only draws on demand: ask for frames when the place changes.
  useEffect(() => {
    invalidate();
  }, [x, invalidate]);

  useFrame((state) => {
    const current = group.current;
    if (!current) return;
    if (!isPlaced.current) {
      current.position.x = x;
      isPlaced.current = true;
    }
    const distance = x - current.position.x;
    if (Math.abs(distance) < 0.1) {
      current.position.x = x;
    } else {
      current.position.x += distance * SLIDE;
      state.invalidate();
    }
  });

  return (
    <group ref={group} position-y={y} position-z={isActive ? 100 : 0}>
      {children}
    </group>
  );
}
