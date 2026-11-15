import { useQuery } from '@tanstack/react-query';
import { UploadIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import {
  BookCoverTile,
  BookMetadata,
  formatFileSize,
  getLanguageName,
  shouldPollBook,
} from '@/entities/book';
import { EpubUploadForm } from '@/features/upload-book';
import { cn } from '@/shared/lib/utils';
import { AddCard } from '@/shared/ui/add-card';
import {
  Card,
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

export function HomePage() {
  const { t } = useTranslation();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const booksQuery = useQuery({
    ...booksControllerListBooksOptions({
      query: { limit: 20, source: 'owned' },
    }),
    // A fresh upload appears while it parses.
    refetchInterval: (query) =>
      query.state.data?.books.some(isParsing) ? 2_000 : false,
  });
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
      <PageHeader
        centered
        title={t('home.title')}
        description={t('home.description')}
      />

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
                <SelectedBookDetails book={selectedBook} />
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

        {/* Content comes later: reorganize chapters, then generate audio. */}
        <HomeCard
          number={2}
          title={t('home.cards.chapters.title')}
          description={
            hasChapters ? t('home.cards.chapters.description') : lockedHint
          }
          isActive={hasChapters}
        />
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
  contentClassName,
  children,
}: {
  number: number;
  title: string;
  description: string;
  isActive: boolean;
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

// The picked book's cover and details, shown instead of the upload drop card.
function SelectedBookDetails({ book }: { book: BookSummaryResponseDto }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-64 self-center">
        <BookCoverTile
          book={book}
          statusLabel={
            book.parseStatus === 'READY'
              ? null
              : t(`library.status${STATUS_KEYS[book.parseStatus]}`)
          }
        />
      </div>
      <dl className="grid grid-cols-2 gap-4 border-y py-4">
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
