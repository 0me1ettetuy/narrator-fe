import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { Book3D, getBookDepth } from '@/entities/book';
import { type CollectionBookEntryResponseDto } from '@/shared/api';
import { useElementSize } from '@/shared/lib/use-element-size';

// A pile this tall at most; the first books of the collection.
const MAX_BOOKS = 12;
// The longest a book can be (its tallest cover, base px) and how much of the
// area the pile may fill.
const LONGEST_BOOK = 250;
const FILL = 0.7;
// The pile is seen from above (TILT) and turned a little (TURN), in radians.
const TILT = 0.5;
const TURN = -0.5;

// The collection's books piled up and seen from the side: the first on top,
// stacked flush, each lying flat with its spine (and the title on it) facing
// you, seen from above and turned a little. A book's
// thickness follows its word count, like on the shelf.
export default function CollectionBookPile({
  entries,
}: {
  entries: CollectionBookEntryResponseDto[];
}) {
  const { t } = useTranslation();
  const [ref, { width, height }] = useElementSize();
  const books = entries.filter((entry) => entry.book).slice(0, MAX_BOOKS);
  const depths = books.map((entry) => getBookDepth(entry.wordCount));
  const total = depths.reduce((sum, depth) => sum + depth, 0);
  const unit = total
    ? Math.min((width * FILL) / LONGEST_BOOK, (height * FILL) / total)
    : 0;
  // From the bottom of the pile up: the last book is at the bottom.
  const bottoms: number[] = [];
  let top = 0;
  for (let index = books.length - 1; index >= 0; index -= 1) {
    bottoms[index] = top;
    top += depths[index] * unit;
  }

  return (
    <div ref={ref} className="relative size-full min-h-64">
      {width > 0 && height > 0 && unit > 0 && (
        <Canvas
          orthographic
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* The whole pile turns about its own middle. */}
          <group rotation={[TILT, TURN, 0]}>
            <group position={[0, (-total * unit) / 2, 0]}>
              {books.map((entry, index) => {
                return (
                  <group
                    key={entry.bookId}
                    position={[
                      0,
                      bottoms[index] + (depths[index] * unit) / 2,
                      0,
                    ]}
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
                );
              })}
            </group>
          </group>
        </Canvas>
      )}
    </div>
  );
}
