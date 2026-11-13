import { BookOpenIcon, LoaderCircleIcon, SquareIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChapterSummaryResponseDto } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { getAudioProgress, getAudioStageLabel } from '../model/chapter-audio';

// The book page's item in the island: the chapter being voiced, its progress
// and a Stop for the whole book. Shown only while this page has audio running.
export function GenerationItem({
  bookTitle,
  current,
  moreCount,
  coverUrl,
  isStopping,
  onCoverError,
  onStop,
}: {
  bookTitle: string;
  current: ChapterSummaryResponseDto;
  moreCount: number;
  coverUrl: string | undefined;
  isStopping: boolean;
  onCoverError: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation();
  const audio = current.audio;
  const stage =
    audio?.status === 'PROCESSING'
      ? getAudioStageLabel(audio.processingStage, t)
      : t('book.audioQueued');
  const hasParts = audio !== null && audio.totalChunks > 0;

  return (
    <div
      role="region"
      aria-label={t('book.generationRegion')}
      className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex-nowrap"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden bg-background/15"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="size-full object-cover"
            onError={onCoverError}
          />
        ) : (
          <BookOpenIcon className="size-4" />
        )}
      </span>

      <div className="flex min-w-0 flex-[1_1_8rem] flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[10px] font-semibold tracking-[0.08em] uppercase opacity-65">
            {stage} · {bookTitle} ·{' '}
            {t('book.generationChapter', { number: current.position + 1 })}
          </span>
          {hasParts && (
            <span className="shrink-0 text-xs tabular-nums opacity-65">
              {t('book.audioPartsShort', {
                completed: audio.completedChunks,
                total: audio.totalChunks,
              })}
            </span>
          )}
        </div>
        <Progress
          value={audio ? (getAudioProgress(audio) ?? null) : null}
          aria-label={stage}
          className="gap-0 [&_[data-slot=progress-track]]:bg-background/25 [&_[data-slot=progress-indicator]]:bg-background"
        />
        <span className="truncate font-serif text-[13px] opacity-65">
          {current.title}
          {moreCount > 0 &&
            ` · ${t('book.generationMore', { count: moreCount })}`}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-background/25 text-background hover:bg-background/10 hover:text-background"
        disabled={isStopping}
        onClick={onStop}
      >
        {isStopping ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <SquareIcon aria-hidden="true" />
        )}
        {t('book.stopAudio')}
      </Button>
    </div>
  );
}
