import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ListChecksIcon } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

type BookSource = 'choose' | 'upload';

// Wizard: pick or upload a book, optionally reorganize, generate. Steps 2 and 3
// appear once a book exists; Generate is the only required action after step 1.
export function HomePage() {
  const { t } = useTranslation();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedSource, setPickedSource] = useState<BookSource | null>(null);
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
  const source = pickedSource ?? (books.length > 0 ? 'choose' : 'upload');
  const bookQuery = useQuery({
    ...booksControllerGetBookOptions({ path: { bookId: bookId ?? '' } }),
    enabled: bookId !== undefined,
    refetchInterval: (query) =>
      shouldPollBook(query.state.data) ? 1_000 : false,
  });

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-6 sm:py-8">
      <PageHeader title={t('home.title')} description={t('home.description')} />

      <Step number={1} title={t('home.steps.book')}>
        {booksQuery.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Tabs
            value={source}
            onValueChange={(next) => setPickedSource(next as BookSource)}
          >
            <TabsList variant="line" className="w-full justify-start border-b">
              <TabsTrigger value="choose" disabled={books.length === 0}>
                {t('home.chooseBook')}
              </TabsTrigger>
              <TabsTrigger value="upload">{t('home.uploadBook')}</TabsTrigger>
            </TabsList>
            <TabsContent value="choose" className="pt-4">
              <BookPicker books={books} value={bookId} onChange={setPickedId} />
            </TabsContent>
            <TabsContent value="upload" className="pt-4">
              <div className="border bg-card p-5">
                <EpubUploadForm
                  onUploaded={() => {
                    setPickedId(null);
                    setPickedSource('choose');
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </Step>

      {bookId && (
        <>
          <Step
            number={2}
            title={t('home.steps.chapters')}
            note={t('home.optional')}
          >
            <SelectedBook query={bookQuery}>
              {(data) => (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t('library.chapterCount', { count: data.chapters.length })}
                  </span>
                  <Button
                    variant="outline"
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
              )}
            </SelectedBook>
          </Step>

          <Step number={3} title={t('home.steps.generate')}>
            <SelectedBook query={bookQuery}>
              {(data) => (
                <ChapterNarration
                  bookId={data.book.id}
                  language={data.book.language}
                  chapters={data.chapters}
                  isEditing
                />
              )}
            </SelectedBook>
          </Step>
        </>
      )}
    </section>
  );
}

function isParsing(book: BookSummaryResponseDto) {
  return book.parseStatus === 'QUEUED' || book.parseStatus === 'PROCESSING';
}

function Step({
  number,
  title,
  note,
  children,
}: {
  number: number;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  const id = `home-step-${number}`;

  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 border-t pt-4">
      <h2 id={id} className="flex items-baseline gap-3">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground tabular-nums">
          {String(number).padStart(2, '0')}
        </span>
        <span className="text-xl font-medium tracking-[-0.02em]">{title}</span>
        {note && (
          <span className="text-sm font-normal text-muted-foreground">
            {note}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

// Steps 2 and 3 act on the picked book once it has parsed chapters.
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
    <Field>
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
