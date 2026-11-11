import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AudioLinesIcon, BookOpenIcon, UploadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerListBooksOptions,
  ttsModelsControllerListModelsOptions,
} from '@/shared/api';
import { BookCoverTile } from '@/entities/book';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui/empty';
import { Skeleton } from '@/shared/ui/skeleton';

const RECENT_BOOKS = 4;
const STEPS = ['upload', 'model', 'generate'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const booksQuery = useQuery(
    booksControllerListBooksOptions({ query: { limit: 20, source: 'all' } }),
  );
  const books = booksQuery.data?.books;
  const isEmpty = books?.length === 0;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">
            {isEmpty ? t('home.emptyTitle') : t('home.title')}
          </h1>
          <p className="font-serif text-sm text-muted-foreground">
            {isEmpty
              ? t('home.emptyDescription')
              : books
                ? t('library.bookCount', { count: books.length })
                : t('home.description')}
          </p>
        </div>
        <Button render={<Link to="/library" />}>
          <UploadIcon aria-hidden="true" />
          {t('library.addBook')}
        </Button>
      </header>

      {isEmpty ? (
        <>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('home.noBooksTitle')}</EmptyTitle>
              <EmptyDescription>
                {t('home.noBooksDescription')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button render={<Link to="/library" />}>
                <UploadIcon aria-hidden="true" />
                {t('library.addBook')}
              </Button>
            </EmptyContent>
          </Empty>
          <ol className="grid border-t sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step} className="flex flex-col gap-1 pt-4 pr-4">
                <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-base font-semibold">
                  {t(`home.steps.${step}.title`)}
                </span>
                <span className="font-serif text-sm text-muted-foreground">
                  {t(`home.steps.${step}.description`)}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <VoiceCard />
          <section
            aria-labelledby="recent-books"
            className="flex flex-col gap-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2
                id="recent-books"
                className="text-[32px] leading-[1.1] font-medium tracking-[-0.02em]"
              >
                {t('home.recentBooks')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                render={<Link to="/library" />}
              >
                {t('home.openLibrary')}
              </Button>
            </div>
            {books ? (
              <ol className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {books.slice(0, RECENT_BOOKS).map((book) => (
                  <li key={book.id} className="min-w-0">
                    <BookCoverTile book={book} />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                {Array.from({ length: RECENT_BOOKS }, (_, i) => (
                  <Skeleton key={i} className="aspect-[3/4]" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

// The model that new audio uses; changing it happens on the Models page.
function VoiceCard() {
  const { t } = useTranslation();
  const { data } = useQuery(ttsModelsControllerListModelsOptions());
  const selected = data?.groups
    .flatMap((group) => group.models)
    .find((model) => model.id === data.selectedModelId);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{t('home.voiceTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center bg-brand text-card"
            aria-hidden="true"
          >
            <AudioLinesIcon />
          </span>
          <span className="min-w-0 truncate text-sm font-semibold">
            {selected?.displayName ?? t('home.noModel')}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {t('home.voiceHint')}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        {selected && <Badge variant="outline">{t('models.selected')}</Badge>}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          render={<Link to="/models" />}
        >
          {t('home.changeModel')}
        </Button>
      </CardFooter>
    </Card>
  );
}
