import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  type BookDetailResponseDto,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { shouldPollBook } from '@/entities/book';
import { EpubUploadForm } from '@/features/upload-book';
import { ChapterEditor } from '@/widgets/chapter-editor';
import { ChapterNarration } from '@/widgets/chapter-narration';
import { DataState } from '@/shared/ui/data-state';
import { Field, FieldLabel } from '@/shared/ui/field';
import { PageHeader } from '@/shared/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

const SECTIONS = ['upload', 'reorganize', 'generate'] as const;
type HomeSectionId = (typeof SECTIONS)[number];

export function HomePage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<HomeSectionId>('upload');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const booksQuery = useQuery({
    ...booksControllerListBooksOptions({
      query: { limit: 20, source: 'owned' },
    }),
    // A fresh upload appears while it parses.
    refetchInterval: (query) =>
      query.state.data?.books.some(isParsing) ? 2_000 : false,
  });
  const books = booksQuery.data?.books ?? [];
  // Newest book until the reader picks one.
  const bookId = books.find((b) => b.id === pickedId)?.id ?? books[0]?.id;
  const bookQuery = useQuery({
    ...booksControllerGetBookOptions({ path: { bookId: bookId ?? '' } }),
    enabled: bookId !== undefined,
    refetchInterval: (query) =>
      shouldPollBook(query.state.data) ? 1_000 : false,
  });

  return (
    <section className="mx-auto flex h-[calc(100svh-3.5rem)] max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title={t('home.title')}
        description={t('home.description')}
        actions={
          books.length > 0 && (
            <BookPicker books={books} value={bookId} onChange={setPickedId} />
          )
        }
      />

      {/* Side by side on desktop, stacked below it; one section is open. Closed
          sections stay mounted (hidden) so unsaved edits and queued files survive. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {SECTIONS.map((value, index) => (
          <HomeSection
            key={value}
            id={value}
            number={index + 1}
            isOpen={open === value}
            onOpen={() => setOpen(value)}
          >
            {value === 'upload' && (
              <EpubUploadForm onUploaded={() => setPickedId(null)} />
            )}
            {value === 'reorganize' && (
              <SelectedBook bookId={bookId} query={bookQuery}>
                {(data) => (
                  <ChapterEditor
                    key={data.book.id}
                    bookId={data.book.id}
                    chapters={data.chapters}
                  />
                )}
              </SelectedBook>
            )}
            {value === 'generate' && (
              <SelectedBook bookId={bookId} query={bookQuery}>
                {(data) => (
                  <ChapterNarration
                    bookId={data.book.id}
                    language={data.book.language}
                    chapters={data.chapters}
                    toolbarClassName="top-0"
                    isEditing
                  />
                )}
              </SelectedBook>
            )}
          </HomeSection>
        ))}
      </div>
    </section>
  );
}

function HomeSection({
  id,
  number,
  isOpen,
  onOpen,
  children,
}: {
  id: HomeSectionId;
  number: number;
  isOpen: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const title = t(`home.sections.${id}`);

  return (
    <section
      aria-labelledby={`home-${id}-title`}
      className={cn(
        'flex min-h-0 min-w-0 border bg-card',
        isOpen ? 'flex-1 flex-col' : 'lg:w-14 lg:flex-none lg:flex-col',
      )}
    >
      <h2 className="m-0">
        <button
          type="button"
          id={`home-${id}-title`}
          aria-expanded={isOpen}
          aria-controls={`home-${id}-panel`}
          onClick={onOpen}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3 text-left',
            isOpen
              ? 'cursor-default border-b'
              : 'cursor-pointer hover:bg-accent lg:h-full lg:flex-col lg:py-4',
          )}
        >
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground tabular-nums uppercase">
            {String(number).padStart(2, '0')}
          </span>
          <span
            className={cn(
              'font-medium tracking-[-0.02em]',
              isOpen
                ? 'text-xl'
                : 'text-base text-muted-foreground lg:[writing-mode:vertical-rl]',
            )}
          >
            {title}
          </span>
        </button>
      </h2>
      <div
        id={`home-${id}-panel`}
        role="region"
        aria-labelledby={`home-${id}-title`}
        hidden={!isOpen}
        className={cn(
          'min-h-0 flex-1 flex-col overflow-y-auto p-5',
          isOpen ? 'flex' : 'hidden',
        )}
      >
        {children}
      </div>
    </section>
  );
}

function isParsing(book: BookSummaryResponseDto) {
  return book.parseStatus === 'QUEUED' || book.parseStatus === 'PROCESSING';
}

// Sections 2 and 3 act on the picked book; they wait for one and its chapters.
function SelectedBook({
  bookId,
  query,
  children,
}: {
  bookId: string | undefined;
  query: Parameters<typeof DataState<BookDetailResponseDto, Error>>[0]['query'];
  children: (data: BookDetailResponseDto) => ReactNode;
}) {
  const { t } = useTranslation();

  if (!bookId) {
    return (
      <p className="text-sm text-muted-foreground">{t('home.needsBook')}</p>
    );
  }

  return (
    <DataState
      query={query}
      isEmpty={(data) => data.chapters.length === 0}
      loading={<Skeleton className="h-96 w-full" />}
      empty={
        <p className="text-sm text-muted-foreground">
          {query.data?.book.parseStatus === 'FAILED'
            ? t('book.chaptersFailed')
            : query.data?.book.parseStatus === 'READY'
              ? t('book.noChapters')
              : t('book.chaptersPending')}
        </p>
      }
    >
      {children}
    </DataState>
  );
}

function BookPicker({
  books,
  value,
  onChange,
}: {
  books: BookSummaryResponseDto[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <Field className="w-full sm:w-72">
      <FieldLabel htmlFor="home-book">{t('home.bookLabel')}</FieldLabel>
      <Select value={value} onValueChange={(id) => onChange(id as string)}>
        <SelectTrigger id="home-book" className="w-full">
          <SelectValue>
            {(id: string | null) => books.find((b) => b.id === id)?.title}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {books.map((book) => (
            <SelectItem key={book.id} value={book.id}>
              {book.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
