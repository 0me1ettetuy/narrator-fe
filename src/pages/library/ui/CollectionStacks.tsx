import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Link } from '@tanstack/react-router';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Group } from 'three';
import { BOOK_W, Book3D, hashString } from '@/entities/book';
import { type CollectionListItemResponseDto } from '@/shared/api';
import { useElementSize } from '@/shared/lib/use-element-size';
import { SaveCollectionToggle } from './CollectionCard';
import { TopLeftAnchor } from './TopLeftAnchor';

// How wide a book is in its slot (share of the slot's width), leaving room for
// the fan on hover and for the tilt.
const BOOK_SHARE = 0.45;
// Gap between stacked books in depth, and how far each lower book moves aside
// and turns when the stack spreads (base px, base radians).
const Z_STEP = 60;
const SPREAD_STEP = 0.2 * BOOK_W;
const SPREAD_TURN = 0.07;
// Resting jumble: each book is turned up to ±REST_TURN and shifted up to ±REST_SHIFT.
const REST_TURN = 0.2;
const REST_SHIFT = 5;
const SHADOW_COLOR = '#000000';
const SHADOW_OPACITY = 0.3;

type Slot = { left: number; top: number; width: number; height: number };

// The Collections tab: a card per collection with a stack of its books' covers
// seen from above (3D books, one shared canvas laid over the cards). Hovering a
// card fans the stack out. The canvas never takes the pointer: the DOM cards do.
export function CollectionStacks({
  collections,
}: {
  collections: CollectionListItemResponseDto[];
}) {
  const [ref, { width, height }] = useElementSize();
  const slotElements = useRef(new Map<string, HTMLElement>());
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const setSlotElement = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) slotElements.current.set(id, element);
      else slotElements.current.delete(id);
    },
    [],
  );

  // Where each stack's area sits in the grid, in px from its top left corner;
  // measured again whenever the grid is resized (columns or text wrapping).
  useLayoutEffect(() => {
    const origin = ref.current?.getBoundingClientRect();
    if (!origin) return;
    const next: Record<string, Slot> = {};
    slotElements.current.forEach((element, id) => {
      const rect = element.getBoundingClientRect();
      next[id] = {
        left: rect.left - origin.left,
        top: rect.top - origin.top,
        width: rect.width,
        height: rect.height,
      };
    });
    setSlots((current) =>
      JSON.stringify(current) === JSON.stringify(next) ? current : next,
    );
  }, [ref, width, height, collections]);

  return (
    <div ref={ref} className="relative">
      <div className="grid items-start gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((collection) => (
          <CollectionStackCard
            key={collection.id}
            collection={collection}
            setSlotElement={setSlotElement}
            onHover={(isHovered) =>
              setActiveId((current) =>
                isHovered
                  ? collection.id
                  : current === collection.id
                    ? null
                    : current,
              )
            }
          />
        ))}
      </div>
      {width > 0 && (
        <Canvas
          orthographic
          frameloop="demand"
          dpr={[1, 2]}
          camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 1000 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <TopLeftAnchor>
            <Suspense fallback={null}>
              {collections.map((collection) =>
                slots[collection.id] ? (
                  <CollectionStack
                    key={collection.id}
                    collection={collection}
                    slot={slots[collection.id]}
                    isActive={activeId === collection.id}
                  />
                ) : null,
              )}
            </Suspense>
          </TopLeftAnchor>
        </Canvas>
      )}
    </div>
  );
}

// The card in the DOM: the slot the stack is drawn over (a link), then the text.
function CollectionStackCard({
  collection,
  setSlotElement,
  onHover,
}: {
  collection: CollectionListItemResponseDto;
  setSlotElement: (id: string, element: HTMLElement | null) => void;
  onHover: (isHovered: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex min-w-0 flex-col gap-2"
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <Link
        ref={(element) => setSlotElement(collection.id, element)}
        to="/library/collections/$collectionId"
        params={{ collectionId: collection.id }}
        // The title below is the link for keyboards and screen readers.
        aria-hidden="true"
        tabIndex={-1}
        className="relative block aspect-square"
      >
        <span className="absolute top-2 right-2 inline-flex h-5 items-center bg-card px-1.5 text-[10px] font-semibold tracking-[0.06em] text-foreground uppercase">
          {collection.visibility === 'PUBLIC'
            ? t('book.publicBadge')
            : t('collection.privateBadge')}
        </span>
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {t('collection.kind')} ·{' '}
          {t('library.bookCount', { count: collection.bookCount })}
        </span>
        <Link
          to="/library/collections/$collectionId"
          params={{ collectionId: collection.id }}
          aria-label={t('collection.open', { title: collection.title })}
          title={collection.title}
          className="font-serif text-lg leading-[1.12] hover:underline"
        >
          {collection.title}
        </Link>
        {collection.description && (
          <p className="line-clamp-2 text-[13px] text-muted-foreground">
            {collection.description}
          </p>
        )}
      </div>
      {!collection.isOwner && <SaveCollectionToggle collection={collection} />}
    </div>
  );
}

// One collection's stack, centred in its slot: the first book on top, the
// others below it; a collection with no covers is one plain book with its title.
function CollectionStack({
  collection,
  slot,
  isActive,
}: {
  collection: CollectionListItemResponseDto;
  slot: Slot;
  isActive: boolean;
}) {
  const { t } = useTranslation();
  const unit = (slot.width * BOOK_SHARE) / BOOK_W;
  const covers = collection.coverUrls.length ? collection.coverUrls : [null];

  return (
    <group
      position={[slot.left + slot.width / 2, -(slot.top + slot.height / 2), 0]}
    >
      {covers.map((coverUrl, index) => (
        <StackBook
          key={`${collection.id}:${index}`}
          id={`${collection.id}:${index}`}
          title={collection.title}
          author={t('collection.kind')}
          coverUrl={coverUrl ?? undefined}
          index={index}
          count={covers.length}
          unit={unit}
          isActive={isActive}
        />
      ))}
    </group>
  );
}

// A book lying face up in a stack. At rest it is turned and shifted a little by
// its id, so the stack is not flush; active, the books fan out about the centre
// (the lower ones moving further and turning more) and ease back when it ends.
function StackBook({
  id,
  title,
  author,
  coverUrl,
  index,
  count,
  unit,
  isActive,
}: {
  id: string;
  title: string;
  author: string;
  coverUrl: string | undefined;
  index: number;
  count: number;
  unit: number;
  isActive: boolean;
}) {
  const group = useRef<Group>(null);
  const progress = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const [height, setHeight] = useState(0);
  const rest = useMemo(() => {
    const hash = hashString(id);
    const unitRandom = (shift: number) =>
      ((hash >>> shift) % 1000) / 1000 - 0.5;

    return {
      turn: unitRandom(0) * 2 * REST_TURN,
      x: unitRandom(10) * 2 * REST_SHIFT,
      y: unitRandom(20) * 2 * REST_SHIFT,
    };
  }, [id]);

  // The canvas only draws on demand: ask for frames when the hover changes.
  useEffect(() => {
    invalidate();
  }, [isActive, invalidate]);

  useFrame((state) => {
    const target = isActive ? 1 : 0;
    progress.current += (target - progress.current) * 0.18;
    if (Math.abs(target - progress.current) < 0.001) {
      progress.current = target;
    } else {
      state.invalidate();
    }
    // -1 to 1 across the stack: the top book is on the left of the fan.
    const fan = count > 1 ? index - (count - 1) / 2 : 0;
    group.current?.position.set(
      (rest.x + progress.current * fan * SPREAD_STEP) * unit,
      (rest.y - progress.current * Math.abs(fan) * 2) * unit,
      (count - index) * Z_STEP,
    );
    group.current?.rotation.set(
      0,
      0,
      rest.turn + progress.current * fan * SPREAD_TURN,
    );
  });

  return (
    <group ref={group}>
      {/* A soft shadow under the book, so the covers below it read as lower. */}
      {height > 0 && (
        <mesh position={[3 * unit, -3 * unit, -20]}>
          <planeGeometry args={[BOOK_W * unit, height * unit]} />
          <meshBasicMaterial
            color={SHADOW_COLOR}
            transparent
            opacity={SHADOW_OPACITY}
            depthWrite={false}
          />
        </mesh>
      )}
      <Book3D
        bookId={id}
        title={title}
        author={author}
        coverUrl={coverUrl}
        wordCount={undefined}
        x={0}
        y={0}
        unit={unit}
        isActive={false}
        isFlat
        onHeight={setHeight}
      />
    </group>
  );
}
