import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LibraryBigIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { booksControllerListBooksOptions } from '@/shared/api';
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
import { toast } from '@/shared/ui/toast';
import { EpubUploadForm } from './EpubUploadForm';
import { LibraryBooks } from './LibraryBooks';
import { LibraryBooksSkeleton } from './LibraryBooksSkeleton';

export function LibraryPage() {
  const { t } = useTranslation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const booksQuery = useQuery({
    ...booksControllerListBooksOptions({ query: { limit: 20 } }),
    refetchInterval: (query) =>
      query.state.data?.books.some(
        (book) =>
          book.parseStatus === 'QUEUED' || book.parseStatus === 'PROCESSING',
      )
        ? 3_000
        : false,
  });

  function handleUploaded() {
    setIsUploadOpen(false);
    toast.add({ title: t('library.uploadQueued'), type: 'success' });
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('library.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('library.description')}
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <PlusIcon />
          {t('library.addBook')}
        </Button>
      </div>

      <div className="mt-8">
        <DataState
          query={booksQuery}
          isEmpty={(data) => data.books.length === 0}
          loading={<LibraryBooksSkeleton />}
          empty={
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LibraryBigIcon />
                </EmptyMedia>
                <EmptyTitle>{t('library.emptyTitle')}</EmptyTitle>
                <EmptyDescription>
                  {t('library.emptyDescription')}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <PlusIcon />
                  {t('library.addBook')}
                </Button>
              </EmptyContent>
            </Empty>
          }
        >
          {(data) => <LibraryBooks books={data.books} />}
        </DataState>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('library.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('library.uploadDescription')}
            </DialogDescription>
          </DialogHeader>
          <EpubUploadForm onUploaded={handleUploaded} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
