import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { UploadIcon } from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerListBooksInfiniteOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import {
  BookMetadata,
  formatFileSize,
  getLanguageName,
  shouldPollBook,
} from '@/entities/book';
import { EpubUploadForm } from '@/features/upload-book';
import { cn } from '@/shared/lib/utils';
import { ChapterEditor } from '@/widgets/chapter-editor';
import { ChapterNarration } from '@/widgets/chapter-narration';
import { AddCard } from '@/shared/ui/add-card';
import { Button } from '@/shared/ui/button';
import { ButtonGroup } from '@/shared/ui/button-group';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/ui/empty';
import { Field, FieldLabel } from '@/shared/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Skeleton } from '@/shared/ui/skeleton';

const BookShowcase = lazy(() => import('./BookShowcase'));

const MODES = ['reorganize', 'narrate'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [mode, setMode] = useState<(typeof MODES)[number]>('reorganize');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const booksQuery = useInfiniteQuery({
    ...booksControllerListBooksInfiniteOptions({
      query: { limit: 50, source: 'owned' },
    }),
    initialPageParam: 0,
    // The generated type loses that the backend sends a number or null.
    getNextPageParam: (lastPage) =>
      (lastPage.nextOffset as unknown as number | null) ?? undefined,
    select: (data) => ({ books: data.pages.flatMap((page) => page.books) }),
    // A fresh upload appears while it parses.
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) => page.books.some(isParsing))
        ? 2_000
        : false,
  });
  // The picker needs every book, so keep loading pages until the last one.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = booksQuery;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const books = booksQuery.data?.books ?? [];
  // Nothing is preselected: cards 2 and 3 unlock when a book is picked or uploaded.
  const selectedBook = books.find((b) => b.id === pickedId);
  const bookId = selectedBook?.id;
  const bookQuery = useQuery({
    ...booksControllerGetBookOptions({ path: { bookId: bookId ?? '' } }),
    enabled: bookId !== undefined,
    refetchInterval: (query) =>
      shouldPollBook(query.state.data) ? 1_000 : false,
  });
  const book = bookQuery.data;
  const hasChapters = book !== undefined && book.chapters.length > 0;
  const lockedHint = !bookId
    ? t('home.chooseFirst')
    : bookQuery.isError || book?.book.parseStatus === 'FAILED'
      ? t('book.chaptersFailed')
      : book?.book.parseStatus === 'READY'
        ? t('book.noChapters')
        : t('book.chaptersPending');

  function openUpload(files: File[]) {
    setDroppedFiles(files);
    setIsUploadOpen(true);
  }

  return (
    <section className="flex w-full flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
      <h1 className="sr-only">{t('home.title')}</h1>

      {/* Side by side on desktop, stacked below it; the chapters card is the widest. */}
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:grid-rows-[minmax(0,1fr)]">
        <HomeCard
          number={1}
          title={t('home.cards.book.title')}
          description={t('home.cards.book.description')}
          isActive
          contentClassName="flex flex-col"
        >
          {booksQuery.isPending ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <div className="flex flex-1 flex-col gap-4">
              {books.length > 0 && (
                <BookPicker
                  books={books}
                  value={bookId}
                  onChange={setPickedId}
                />
              )}
              {selectedBook ? (
                <SelectedBookDetails
                  book={selectedBook}
                  wordCount={book?.chapters.reduce(
                    (sum, chapter) => sum + chapter.wordCount,
                    0,
                  )}
                />
              ) : (
                <>
                  {books.length > 0 && (
                    <div
                      role="separator"
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <span className="h-px flex-1 bg-border" />
                      {t('home.and')}
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <AddCard
                    className="aspect-auto min-h-48 flex-1"
                    title={t('library.dropEpub')}
                    hint={t('library.dropHint')}
                    icon={<UploadIcon aria-hidden="true" />}
                    onClick={() => openUpload([])}
                    onDropFiles={openUpload}
                  />
                </>
              )}
            </div>
          )}
        </HomeCard>

        <HomeCard
          number={2}
          title={t('home.cards.chapters.title')}
          description={t('home.cards.chapters.description')}
          isActive={hasChapters}
          action={
            <ButtonGroup aria-label={t('home.modes.label')}>
              {MODES.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={mode === value ? 'default' : 'outline'}
                  aria-pressed={mode === value}
                  disabled={!hasChapters}
                  onClick={() => setMode(value)}
                >
                  {t(`home.modes.${value}`)}
                </Button>
              ))}
            </ButtonGroup>
          }
          contentClassName="flex flex-col"
        >
          {!hasChapters && (
            <Empty className="border-0 opacity-60">
              <EmptyHeader>
                <EmptyTitle className="text-muted-foreground">
                  {lockedHint}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
          {hasChapters && (
            // Both views stay mounted so unsaved reorganize edits survive a switch.
            <>
              <div
                className={cn(
                  'h-[min(40rem,75svh)] flex-col lg:h-auto lg:min-h-0 lg:flex-1',
                  mode === 'reorganize' ? 'flex' : 'hidden',
                )}
              >
                <ChapterEditor
                  key={book.book.id}
                  bookId={book.book.id}
                  chapters={book.chapters}
                />
              </div>
              <div hidden={mode !== 'narrate'}>
                <ChapterNarration
                  bookId={book.book.id}
                  language={book.book.language}
                  chapters={book.chapters}
                  toolbarClassName="top-14 lg:top-0"
                  isEditing
                />
              </div>
            </>
          )}
        </HomeCard>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('library.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.uploadDescription')}
            </DialogDescription>
          </DialogHeader>
          <EpubUploadForm
            initialFiles={droppedFiles}
            onCancel={() => setIsUploadOpen(false)}
            onUploaded={([uploadedId]) => {
              setPickedId(uploadedId);
              setIsUploadOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

function isParsing(book: BookSummaryResponseDto) {
  return book.parseStatus === 'QUEUED' || book.parseStatus === 'PROCESSING';
}

// A step card; an inactive one is dimmed and its content is unavailable.
function HomeCard({
  number,
  title,
  description,
  isActive,
  action,
  contentClassName,
  children,
}: {
  number: number;
  title: string;
  description: string;
  isActive: boolean;
  // Top-right of the header.
  action?: ReactNode;
  contentClassName?: string;
  children?: ReactNode;
}) {
  return (
    <Card aria-disabled={!isActive || undefined} className="lg:min-h-0">
      <CardHeader className={cn(!isActive && 'opacity-60')}>
        <CardTitle className="flex items-baseline gap-3 text-xl font-medium">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground tabular-nums">
            {String(number).padStart(2, '0')}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {action && (
          // Under the text on phones, so the buttons don't squeeze the title.
          <CardAction className="max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:mt-3 max-sm:justify-self-start">
            {action}
          </CardAction>
        )}
      </CardHeader>
      {children && (
        <CardContent
          className={cn(
            'lg:min-h-0 lg:flex-1 lg:overflow-y-auto',
            contentClassName,
          )}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// Stands for "no book" in the select, whose items need a string value.
const NO_BOOK = 'none';

function BookPicker({
  books,
  value,
  onChange,
}: {
  books: BookSummaryResponseDto[];
  value: string | undefined;
  onChange: (id: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <Field>
      <FieldLabel htmlFor="home-book">{t('home.bookLabel')}</FieldLabel>
      <Select
        value={value ?? NO_BOOK}
        onValueChange={(id) => onChange(id === NO_BOOK ? null : (id as string))}
      >
        <SelectTrigger id="home-book" className="w-full">
          <SelectValue>
            {(id: string | null) =>
              books.find((b) => b.id === id)?.title ?? t('home.notSelected')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_BOOK}>{t('home.notSelected')}</SelectItem>
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

// The picked book as a big 3D book with its details at the bottom, shown instead
// of the upload drop card. The book stretches to fill the card.
function SelectedBookDetails({
  book,
  wordCount,
}: {
  book: BookSummaryResponseDto;
  wordCount: number | undefined;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Suspense fallback={<Skeleton className="min-h-80 flex-1" />}>
        <BookShowcase
          book={book}
          wordCount={wordCount}
          statusLabel={
            book.parseStatus === 'READY'
              ? null
              : t(`library.status${STATUS_KEYS[book.parseStatus]}`)
          }
        />
      </Suspense>
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-medium">{book.title}</h3>
        <p className="text-sm text-muted-foreground">
          {book.authors.map((author) => author.name).join(', ') ||
            t('book.unknownAuthor')}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-4 border-y py-4">
        <BookMetadata
          label={t('book.chaptersTitle')}
          value={String(book.chapterCount)}
        />
        {book.language && (
          <BookMetadata
            label={t('book.language')}
            value={getLanguageName(book.language, i18n.language)}
          />
        )}
        <BookMetadata
          label={t('book.fileSize')}
          value={formatFileSize(book.sourceSize, i18n.language)}
        />
      </dl>
    </div>
  );
}

const STATUS_KEYS = {
  UPLOADING: 'Uploading',
  QUEUED: 'Queued',
  PROCESSING: 'Processing',
  READY: 'Ready',
  FAILED: 'Failed',
} as const;
