import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookOpenIcon, ListChecksIcon, UploadIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookOptions,
  booksControllerListBooksOptions,
  type BookDetailResponseDto,
  type BookSummaryResponseDto,
} from '@/shared/api';
import { shouldPollBook } from '@/entities/book';
import { EpubUploadForm } from '@/features/upload-book';
import { ChapterNarration } from '@/widgets/chapter-narration';
import { Button } from '@/shared/ui/button';
import { DataState } from '@/shared/ui/data-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
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
    <section className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-6 sm:py-8">
      <PageHeader title={t('home.title')} description={t('home.description')} />

      {booksQuery.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : books.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t('library.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('library.emptyDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setIsUploadOpen(true)}>
              <UploadIcon aria-hidden="true" />
              {t('library.addBook')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <BookPicker books={books} value={bookId} onChange={setPickedId} />
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
              <UploadIcon aria-hidden="true" />
              {t('library.addBook')}
            </Button>
          </div>
          <SelectedBook query={bookQuery}>
            {(data) => (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t('library.chapterCount', { count: data.chapters.length })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <Link
                        to="/library/$bookId/reorganize"
                        params={{ bookId: data.book.id }}
                      />
                    }
                  >
                    <ListChecksIcon aria-hidden="true" />
                    {t('book.reorganizeChapters')}
                  </Button>
                </div>
                <ChapterNarration
                  bookId={data.book.id}
                  language={data.book.language}
                  chapters={data.chapters}
                  isEditing
                />
              </div>
            )}
          </SelectedBook>
        </>
      )}

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('library.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.uploadDescription')}
            </DialogDescription>
          </DialogHeader>
          <EpubUploadForm
            onCancel={() => setIsUploadOpen(false)}
            onUploaded={() => {
              setPickedId(null);
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

// The picked book's chapters, or why there are none yet.
function SelectedBook({
  query,
  children,
}: {
  query: Parameters<typeof DataState<BookDetailResponseDto, Error>>[0]['query'];
  children: (data: BookDetailResponseDto) => ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <DataState
      query={query}
      isEmpty={(data) => data.chapters.length === 0}
      loading={<Skeleton className="h-32 w-full" />}
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
    <Field className="min-w-48 flex-1">
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
