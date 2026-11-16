import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Group } from 'three';
import { BOOK_W, Book3D, getBookDepth } from '@/entities/book';
import { type CollectionBookEntryResponseDto } from '@/shared/api';
import { useElementSize } from '@/shared/lib/use-element-size';

// A stack holds this many books; the next ones start a new stack behind it, up
// to MAX_STACKS stacks (the rest are not drawn).
const STACK_SIZE = 6;
const MAX_STACKS = 3;
// Gap in depth between stacks (base px, on top of a book's width).
const STACK_GAP = 24;
// The longest a book can be (its tallest cover, base px) and how much of the
// area the pile may fill.
const LONGEST_BOOK = 250;
const FILL = 0.8;
// The pile is seen from above (TILT) and turned a little (TURN), in radians;
// hovering it turns it HOVER_TURN further, slowly.
const TILT = 0.5;
const TURN = -0.5;
const HOVER_TURN = 0.4;
const TURN_EASE = 0.06;

// The collection's books as stacks seen from above and turned a little: the
// first book on top of the front stack, stacked flush, each lying flat with its
// spine (and the title on it) facing you. More than STACK_SIZE books start
// another stack behind. A book's thickness follows its word count, like on the
// shelf. Hovering turns the pile.
export default function CollectionBookPile({
  entries,
}: {
  entries: CollectionBookEntryResponseDto[];
}) {
  const { t } = useTranslation();
  const [ref, { width, height }] = useElementSize();
  const [isActive, setIsActive] = useState(false);
  const books = entries
    .filter((entry) => entry.book)
    .slice(0, STACK_SIZE * MAX_STACKS);
  const stacks = Array.from(
    { length: Math.ceil(books.length / STACK_SIZE) },
    (_, index) =>
      books
        .slice(index * STACK_SIZE, (index + 1) * STACK_SIZE)
        .map((entry) => ({
          entry,
          depth: getBookDepth(entry.wordCount),
        })),
  );
  // The tallest stack (base px) sets the pile's height.
  const pileHeight = Math.max(
    0,
    ...stacks.map((stack) => stack.reduce((sum, { depth }) => sum + depth, 0)),
  );
  const spacing = BOOK_W + STACK_GAP;
  // Depth of the pile (base px): front of the first stack to back of the last.
  const pileDepth = (stacks.length - 1) * spacing + BOOK_W;
  const extent = getScreenExtent(pileHeight, pileDepth);
  const unit = pileHeight
    ? Math.min((width * FILL) / extent.width, (height * FILL) / extent.height)
    : 0;

  return (
    <div
      ref={ref}
      className="relative size-full min-h-64"
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
    >
      {width > 0 && height > 0 && unit > 0 && (
        <Canvas
          orthographic
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <TurningPile isActive={isActive}>
            {/* Centre the pile on the point it turns about. */}
            <group
              position={[
                0,
                (-pileHeight * unit) / 2,
                ((pileDepth - BOOK_W) / 2) * unit,
              ]}
            >
              {stacks.map((stack, stackIndex) => {
                // From the bottom of the stack up: the last book is at the bottom.
                const bottoms: number[] = [];
                let bottom = 0;
                for (let index = stack.length - 1; index >= 0; index -= 1) {
                  bottoms[index] = bottom;
                  bottom += stack[index].depth * unit;
                }

                return (
                  // Later stacks stand further back.
                  <group
                    key={stackIndex}
                    position={[0, 0, -stackIndex * spacing * unit]}
                  >
                    {stack.map(({ entry, depth }, index) => (
                      <group
                        key={entry.bookId}
                        position={[0, bottoms[index] + (depth * unit) / 2, 0]}
                      >
                        {/* Lay the book down (cover up), then turn it so its spine faces you. */}
                        <group rotation={[0, Math.PI / 2, 0]}>
                          <group rotation={[-Math.PI / 2, 0, 0]}>
                            <Book3D
                              bookId={entry.bookId}
                              title={entry.title}
                              author={
                                entry.book?.authors
                                  .map((author) => author.name)
                                  .join(', ') || t('book.unknownAuthor')
                              }
                              coverUrl={entry.coverUrl ?? undefined}
                              wordCount={entry.wordCount}
                              x={0}
                              y={0}
                              unit={unit}
                              isActive={false}
                              isFlat
                              isPending={entry.book?.parseStatus !== 'READY'}
                            />
                          </group>
                        </group>
                      </group>
                    ))}
                  </group>
                );
              })}
            </group>
          </TurningPile>
        </Canvas>
      )}
    </div>
  );
}

// Holds the pile at its resting angle and eases it round while active.
function TurningPile({
  isActive,
  children,
}: {
  isActive: boolean;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const progress = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  // The canvas only draws on demand: ask for frames when the hover changes.
  useEffect(() => {
    invalidate();
  }, [isActive, invalidate]);

  useFrame((state) => {
    const target = isActive ? 1 : 0;
    progress.current += (target - progress.current) * TURN_EASE;
    if (Math.abs(target - progress.current) < 0.001) {
      progress.current = target;
    } else {
      state.invalidate();
    }
    group.current?.rotation.set(TILT, TURN + progress.current * HOVER_TURN, 0);
  });

  return <group ref={group}>{children}</group>;
}

// The pile's size on screen at unit 1, given its height and depth (base px):
// the corners of its box after the tilt and the resting turn. The box is
// centred on the point the pile turns about, so the extent is symmetric.
function getScreenExtent(height: number, depth: number) {
  let maxX = 0;
  let maxY = 0;
  for (const x of [-LONGEST_BOOK / 2, LONGEST_BOOK / 2]) {
    for (const y of [-height / 2, height / 2]) {
      for (const z of [-depth / 2, depth / 2]) {
        const turnedX = x * Math.cos(TURN) + z * Math.sin(TURN);
        const turnedZ = -x * Math.sin(TURN) + z * Math.cos(TURN);
        maxX = Math.max(maxX, Math.abs(turnedX));
        maxY = Math.max(
          maxY,
          Math.abs(y * Math.cos(TILT) - turnedZ * Math.sin(TILT)),
        );
      }
    }
  }

  return { width: Math.max(1, maxX * 2), height: Math.max(1, maxY * 2) };
}
