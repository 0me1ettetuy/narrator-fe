import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ListChecksIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { shouldPollBook } from '@/entities/book';
import { EpubUploadForm } from '@/features/upload-book';
import { ChapterNarration } from '@/widgets/chapter-narration';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
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
  const [uploadCount, setUploadCount] = useState(0);
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
  const bookId = books.find((b) => b.id === pickedId)?.id;
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

  return (
    <section className="flex w-full flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8 lg:h-[calc(100svh-3.5rem)]">
      <PageHeader
        centered
        title={t('home.title')}
        description={t('home.description')}
      />

      {/* Side by side on desktop, stacked below it; Generate gets the widest column. */}
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] lg:grid-rows-[minmax(0,1fr)]">
        <HomeCard
          number={1}
          title={t('home.cards.book.title')}
          description={t('home.cards.book.description')}
          isActive
        >
          {booksQuery.isPending ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <div className="flex flex-col gap-4">
              {books.length > 0 && (
                <>
                  <BookPicker
                    books={books}
                    value={bookId}
                    onChange={setPickedId}
                  />
                  <div
                    role="separator"
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <span className="h-px flex-1 bg-border" />
                    {t('home.and')}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}
              {/* Same surface and header as the library's upload dialog; its p-5 matches the form's full-bleed file list. */}
              <div className="flex flex-col gap-4 bg-popover p-5 ring-1 ring-border">
                <div className="flex flex-col gap-2">
                  <h3 className="font-heading text-xl font-semibold tracking-[-0.01em]">
                    {t('library.uploadTitle')}
                  </h3>
                  <p className="font-serif text-sm text-muted-foreground">
                    {t('library.uploadDescription')}
                  </p>
                </div>
                <EpubUploadForm
                  // New key resets the form after an upload; it would stay "uploading".
                  key={uploadCount}
                  onUploaded={([uploadedId]) => {
                    setPickedId(uploadedId);
                    setUploadCount((count) => count + 1);
                  }}
                />
              </div>
            </div>
          )}
        </HomeCard>

        <HomeCard
          number={2}
          title={t('home.cards.reorganize.title')}
          description={
            hasChapters ? t('home.cards.reorganize.description') : lockedHint
          }
          isActive={hasChapters}
        >
          {hasChapters && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {t('library.chapterCount', { count: book.chapters.length })}
              </span>
              <Button
                variant="outline"
                render={
                  <Link
                    to="/library/$bookId/reorganize"
                    params={{ bookId: book.book.id }}
                  />
                }
              >
                <ListChecksIcon aria-hidden="true" />
                {t('book.reorganizeChapters')}
              </Button>
            </div>
          )}
        </HomeCard>

        <HomeCard
          number={3}
          title={t('home.cards.generate.title')}
          description={
            hasChapters ? t('home.cards.generate.description') : lockedHint
          }
          isActive={hasChapters}
        >
          {hasChapters && (
            <ChapterNarration
              bookId={book.book.id}
              language={book.book.language}
              chapters={book.chapters}
              isEditing
              toolbarClassName="top-14 lg:top-0"
            />
          )}
        </HomeCard>
      </div>
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
  children,
}: {
  number: number;
  title: string;
  description: string;
  isActive: boolean;
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
        <CardContent className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {children}
        </CardContent>
      )}
    </Card>
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
    <Field className="min-w-48 flex-1">
      <FieldLabel htmlFor="home-book">{t('home.bookLabel')}</FieldLabel>
      <Select
        value={value ?? null}
        onValueChange={(id) => onChange(id as string)}
      >
        <SelectTrigger id="home-book" className="w-full">
          <SelectValue>
            {(id: string | null) =>
              books.find((b) => b.id === id)?.title ?? t('home.pickPlaceholder')
            }
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
