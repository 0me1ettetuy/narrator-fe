import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, PointerEvent, WheelEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCoverColor } from '@/entities/book';
import { useCurrentUser } from '@/shared/auth';
import { Button } from '@/shared/ui/button';

const BOOKS = [
  { author: 'George Orwell', isbn: '9780451524935', title: '1984' },
  {
    author: 'Jane Austen',
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
  },
  {
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    title: 'The Great Gatsby',
  },
  { author: 'J.R.R. Tolkien', isbn: '9780547928227', title: 'The Hobbit' },
  {
    author: 'Harper Lee',
    isbn: '9780061120084',
    title: 'To Kill a Mockingbird',
  },
  {
    author: 'J. D. Salinger',
    isbn: '9780316769488',
    title: 'The Catcher in the Rye',
  },
  {
    author: 'Margaret Atwood',
    isbn: '9780385490818',
    title: "The Handmaid's Tale",
  },
  { author: 'Paulo Coelho', isbn: '9780061122415', title: 'The Alchemist' },
  {
    author: 'Fyodor Dostoevsky',
    isbn: '9780140449136',
    title: 'Crime and Punishment',
  },
  { author: 'Leo Tolstoy', isbn: '9780199232765', title: 'War and Peace' },
  { author: 'Frank Herbert', isbn: '9780441172719', title: 'Dune' },
  { author: 'Toni Morrison', isbn: '9781400033416', title: 'Beloved' },
  { author: 'Dan Brown', isbn: '9780307277671', title: 'The Da Vinci Code' },
  {
    author: 'John Steinbeck',
    isbn: '9780143039433',
    title: 'The Grapes of Wrath',
  },
  { author: 'Aldous Huxley', isbn: '9780060850524', title: 'Brave New World' },
  { author: 'James Joyce', isbn: '9780141182803', title: 'Ulysses' },
  {
    author: 'Stephen Hawking',
    isbn: '9780553380163',
    title: 'A Brief History of Time',
  },
  {
    author: 'Jane Austen',
    isbn: '9780679783268',
    title: 'Sense and Sensibility',
  },
  {
    author: 'Mikhail Bulgakov',
    isbn: '9780141180144',
    title: 'The Master and Margarita',
  },
  { author: 'Leo Tolstoy', isbn: '9780143035008', title: 'Anna Karenina' },
] as const;

const BOOK_COLUMNS = BOOKS.slice(0, 10).flatMap((book, index) => [
  book,
  BOOKS[index + 10],
]);
const LOOP_BOOKS = [...BOOK_COLUMNS, ...BOOK_COLUMNS, ...BOOK_COLUMNS];
const DRAG_SENSITIVITY = 0.45;

function coverUrl(isbn: string) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

function HeroBookCard({ book }: { book: (typeof BOOKS)[number] }) {
  const cover = useCoverColor(coverUrl(book.isbn));

  return (
    <article
      className="flex aspect-[3/4] w-[clamp(12rem,15.7vw,20rem)] flex-col overflow-hidden bg-foreground text-background"
      style={cover ?? undefined}
    >
      <div className="aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        <img
          src={coverUrl(book.isbn)}
          alt=""
          className="size-full object-cover"
          draggable={false}
          loading="eager"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1.5 px-3.5 pt-3 pb-3.5">
        <span className="truncate text-[9px] font-semibold tracking-[0.08em] uppercase">
          {book.author}
        </span>
        <span className="line-clamp-2 font-serif text-lg leading-[1.12]">
          {book.title}
        </span>
      </div>
    </article>
  );
}

export function HeroPageAdvanced() {
  const { data, isAuthenticated } = useCurrentUser();
  const { t } = useTranslation();
  const fieldRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    scrollLeft: number;
    x: number;
  } | null>(null);

  const resetLoop = useCallback(() => {
    const field = fieldRef.current;

    if (!field) {
      return;
    }

    const loopWidth = field.scrollWidth / 3;

    if (field.scrollLeft < 1) {
      field.scrollLeft += loopWidth;
    } else if (field.scrollLeft >= loopWidth * 2 - 1) {
      field.scrollLeft -= loopWidth;
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const field = fieldRef.current;

      if (field) {
        field.scrollLeft = field.scrollWidth / 3;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerRef.current = {
        id: event.pointerId,
        scrollLeft: event.currentTarget.scrollLeft,
        x: event.clientX,
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pointer = pointerRef.current;

      if (!pointer || pointer.id !== event.pointerId) {
        return;
      }

      event.currentTarget.scrollLeft =
        pointer.scrollLeft - (event.clientX - pointer.x) * DRAG_SENSITIVITY;
    },
    [],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.id === event.pointerId) {
      pointerRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.currentTarget.scrollBy({
        behavior: 'smooth',
        left: event.key === 'ArrowLeft' ? -72 : 72,
      });
      event.preventDefault();
    }
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    event.currentTarget.scrollLeft += event.deltaX || event.deltaY;
    event.preventDefault();
  }, []);

  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
      <section className="mx-auto flex w-full max-w-6xl basis-[44%] flex-col justify-end gap-4 px-4 py-6 sm:basis-[38%] sm:px-8 sm:py-10">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {t('hero.eyebrow')}
        </span>
        <h1 className="max-w-125 text-4xl leading-[1.04] font-medium tracking-[-0.02em] sm:text-[52px]">
          {t('hero.titleLead')}{' '}
          <span className="font-serif font-normal text-brand italic">
            {t('hero.titleAccent')}
          </span>
        </h1>
        <p className="max-w-110 font-serif text-lg leading-normal text-muted-foreground">
          {isAuthenticated
            ? t('hero.signedInAs', {
                email: data?.user.email ?? t('hero.yourAccount'),
              })
            : t('hero.description')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            render={<Link to={isAuthenticated ? '/home' : '/register'} />}
          >
            {isAuthenticated
              ? t('hero.openWorkspace')
              : t('hero.createAccount')}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </section>
      <section
        className="relative min-h-0 flex-1 overflow-hidden bg-secondary"
        aria-label={t('heroAdvanced.label')}
      >
        <p id="hero-book-field-instructions" className="sr-only">
          {t('heroAdvanced.instructions')}
        </p>
        <div
          ref={fieldRef}
          aria-describedby="hero-book-field-instructions"
          className="absolute inset-0 overflow-x-scroll overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-none cursor-grab select-none active:cursor-grabbing"
          onKeyDown={handleKeyDown}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onScroll={resetLoop}
          onWheel={handleWheel}
          role="region"
          tabIndex={0}
        >
          <div className="grid w-max grid-flow-col grid-rows-2">
            {LOOP_BOOKS.map((book, index) => (
              <HeroBookCard key={`${book.isbn}-${index}`} book={book} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
