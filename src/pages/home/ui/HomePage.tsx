import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ListChecksIcon, UploadIcon } from 'lucide-react';
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
    <section className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 sm:py-8">
      <PageHeader title={t('home.title')} description={t('home.description')} />

      <HomeCard
        number={1}
        title={t('home.cards.book.title')}
        description={t('home.cards.book.description')}
        isActive
      >
        {booksQuery.isPending ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            {books.length > 0 && (
              <BookPicker books={books} value={bookId} onChange={setPickedId} />
            )}
            <Button
              variant={books.length > 0 ? 'outline' : 'default'}
              onClick={() => setIsUploadOpen(true)}
            >
              <UploadIcon aria-hidden="true" />
              {t('library.addBook')}
            </Button>
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
          />
        )}
      </HomeCard>

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
  children,
}: {
  number: number;
  title: string;
  description: string;
  isActive: boolean;
  children?: ReactNode;
}) {
  return (
    <Card aria-disabled={!isActive || undefined}>
      <CardHeader className={cn(!isActive && 'opacity-60')}>
        <CardTitle className="flex items-baseline gap-3 text-xl font-medium">
          <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground tabular-nums">
            {String(number).padStart(2, '0')}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
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
