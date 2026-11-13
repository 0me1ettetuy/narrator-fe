import { useQuery } from '@tanstack/react-query';
import {
  BookOpenIcon,
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  XIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerGetBookCoverAccessOptions,
  getApiErrorTranslationKeyForCode,
  type ApiErrorCode,
} from '@/shared/api';
import { formatAudioTime } from '@/shared/lib/format-audio-time';
import { Button } from '@/shared/ui/button';
import { Slider } from '@/shared/ui/slider';
import { usePlayer } from '../model/player-context';

const ghost = 'text-background hover:bg-background/10 hover:text-background';

// The player row for the island: cover, what is playing, seek and controls.
// Priority and placement are the app layer's job, not this component's.
export function PlayerItem() {
  const { t } = useTranslation();
  const player = usePlayer();
  const { view, activeBookId } = player;
  const cover = useQuery({
    ...booksControllerGetBookCoverAccessOptions({
      path: { bookId: activeBookId ?? '' },
    }),
    enabled: Boolean(activeBookId && view?.hasCover),
    staleTime: 14 * 60 * 1_000,
  });

  if (!view) return null;

  const label = (key: string, values?: Record<string, unknown>) => {
    const text = t(key, values);
    return { 'aria-label': text, title: text };
  };

  return (
    <div
      role="region"
      aria-label={t('player.region')}
      className="flex flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:flex-nowrap"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden bg-background/15"
      >
        {view.hasCover && cover.data ? (
          <img
            src={cover.data.coverUrl}
            alt=""
            className="size-full object-cover"
            onError={() => void cover.refetch()}
          />
        ) : (
          <BookOpenIcon className="size-4" />
        )}
      </span>

      <div className="flex min-w-0 flex-[1_1_8rem] flex-col gap-1 sm:basis-0">
        <span className="truncate text-[10px] font-semibold tracking-[0.08em] uppercase opacity-65">
          {view.isPlaying ? t('player.playing') : t('player.paused')} ·{' '}
          {view.bookTitle} ·{' '}
          {t('player.chapterLabel', { number: view.chapter.position + 1 })}
        </span>
        <span className="truncate font-serif text-[13px]">
          {view.errorCode
            ? t(
                getApiErrorTranslationKeyForCode(
                  view.errorCode as ApiErrorCode,
                ),
              )
            : view.chapter.title}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 text-xs tabular-nums max-sm:order-3 max-sm:basis-full sm:w-36 sm:shrink-0">
        <span>{formatAudioTime(view.currentTime)}</span>
        <Slider
          min={0}
          max={view.duration || 1}
          value={[Math.min(view.currentTime, view.duration || 0)]}
          disabled={view.duration <= 0}
          aria-label={t('player.seek')}
          onValueChange={(value) =>
            player.seek(Array.isArray(value) ? value[0] : value)
          }
          className="[&_[data-slot=slider-range]]:bg-background [&_[data-slot=slider-thumb]]:size-2.5 [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-track]]:bg-background/25"
        />
        <span className="opacity-65">{formatAudioTime(view.duration)}</span>
      </div>

      <div className="flex items-center gap-1 max-sm:order-4 max-sm:basis-full max-sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ghost}
          disabled={!view.hasPrevious}
          onClick={player.previous}
          {...label('player.previousChapter')}
        >
          <SkipBackIcon aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          className="bg-background text-foreground hover:bg-background/90"
          onClick={player.toggle}
          {...label(view.isPlaying ? 'player.pause' : 'player.play')}
        >
          {view.isPlaying ? (
            <PauseIcon aria-hidden="true" />
          ) : (
            <PlayIcon aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={ghost}
          disabled={!view.hasNext}
          onClick={player.next}
          {...label('player.nextChapter')}
        >
          <SkipForwardIcon aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`${ghost} tabular-nums`}
          onClick={player.cycleSpeed}
          {...label('player.speed', { speed: view.speed })}
        >
          {view.speed}×
        </Button>
        {view.downloadUrl && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={ghost}
            nativeButton={false}
            render={<a href={view.downloadUrl} />}
            {...label('player.download')}
          >
            <DownloadIcon aria-hidden="true" />
          </Button>
        )}
      </div>

      <span
        aria-hidden="true"
        className="h-6 w-px bg-background/15 max-sm:hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={`${ghost} max-sm:order-2`}
        onClick={player.close}
        {...label('player.close')}
      >
        <XIcon aria-hidden="true" />
      </Button>
    </div>
  );
}
