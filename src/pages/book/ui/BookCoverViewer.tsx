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
            className="group block size-full cursor-zoom-in border-0 bg-transparent p-0"
            aria-label={t('book.viewCover', { title })}
          />
        }
      >
        <span className="noise block size-full overflow-hidden">
          <img
            src={url}
            alt={coverAlt}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
            onError={onImageError}
          />
        </span>
      </DialogTrigger>
      <DialogContent className="w-fit max-w-[calc(100%-2rem)] place-items-center bg-transparent p-0 ring-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{coverAlt}</DialogTitle>
        </DialogHeader>
        <img
          src={url}
          alt={coverAlt}
          className="max-h-[calc(100vh-4rem)] w-auto max-w-full object-contain"
          onError={onImageError}
        />
      </DialogContent>
    </Dialog>
  );
}
