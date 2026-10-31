import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

type BookCoverViewerProps = {
  title: string;
  url: string;
  onImageError: () => void;
};

export function BookCoverViewer({
  title,
  url,
  onImageError,
}: BookCoverViewerProps) {
  const { t } = useTranslation();
  const coverAlt = t('book.coverAlt', { title });

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group block cursor-zoom-in rounded-lg border-0 bg-transparent p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label={t('book.viewCover', { title })}
          />
        }
      >
        <img
          src={url}
          alt={coverAlt}
          className="h-48 w-32 rounded-lg object-cover ring-1 ring-foreground/10 transition-transform duration-150 group-hover:scale-[1.02] sm:h-56 sm:w-37"
          onError={onImageError}
        />
      </DialogTrigger>
      <DialogContent className="w-fit max-w-[calc(100%-2rem)] place-items-center bg-transparent p-0 ring-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{coverAlt}</DialogTitle>
        </DialogHeader>
        <img
          src={url}
          alt={coverAlt}
          className="max-h-[calc(100vh-4rem)] w-auto max-w-full rounded-lg object-contain"
          onError={onImageError}
        />
      </DialogContent>
    </Dialog>
  );
}
