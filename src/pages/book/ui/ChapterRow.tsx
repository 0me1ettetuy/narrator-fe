import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleAlertIcon,
  CircleStopIcon,
  ClockIcon,
  DownloadIcon,
  EllipsisIcon,
  LoaderCircleIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  booksControllerCancelChapterAudioMutation,
  booksControllerDeleteChapterAudioMutation,
  booksControllerGetBookQueryKey,
  booksControllerGetChapterAudioAccessOptions,
  booksControllerGetChapterAudioAccessQueryKey,
  booksControllerQueueChapterAudioMutation,
  getApiErrorTranslationKey,
  type ChapterAudioAccessResponseDto,
  type ChapterAudioResponseDto,
  type ChapterSummaryResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Progress } from '@/shared/ui/progress';
import { Slider } from '@/shared/ui/slider';

type Translate = ReturnType<typeof useTranslation>['t'];

// Only one chapter plays at a time: starting a player pauses the previous one.
let activeAudio: HTMLAudioElement | null = null;

export function ChapterRow({
  bookId,
  chapter,
  isSelected,
  canQueueAudio,
  voiceId,
  canEdit,
  onSelectionChange,
}: {
  bookId: string;
  chapter: ChapterSummaryResponseDto;
  isSelected: boolean;
  canQueueAudio: boolean;
  voiceId: string | undefined;
  canEdit: boolean;
  onSelectionChange: (selected: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const audio = chapter.audio;
  const isNarrated = chapter.includeInDefaultNarration;
  const pathParams = { path: { bookId, chapterId: chapter.id } };

  const deleteAudio = useMutation({
    ...booksControllerDeleteChapterAudioMutation(),
    onSuccess: async () => {
      setIsDeleteOpen(false);
      clearAudioAccess();
      await invalidateBook();
    },
  });
  const queueAudio = useMutation({
    ...booksControllerQueueChapterAudioMutation(),
    onSuccess: async () => {
      clearAudioAccess();
      await invalidateBook();
    },
  });
  const cancelAudio = useMutation({
    ...booksControllerCancelChapterAudioMutation(),
    onSuccess: invalidateBook,
  });
  const audioAccess = useQuery({
    ...booksControllerGetChapterAudioAccessOptions(pathParams),
    enabled: audio?.status === 'READY',
    staleTime: 14 * 60 * 1_000,
  });
  const mutationError =
    deleteAudio.error ?? queueAudio.error ?? cancelAudio.error;

  async function invalidateBook() {
    await queryClient.invalidateQueries({
      queryKey: booksControllerGetBookQueryKey({ path: { bookId } }),
    });
  }

  function clearAudioAccess() {
    queryClient.removeQueries({
      queryKey: booksControllerGetChapterAudioAccessQueryKey(pathParams),
    });
  }

  const canDelete =
    canEdit &&
    (audio?.status === 'READY' ||
      audio?.status === 'FAILED' ||
      audio?.status === 'CANCELLED');
  const actionLabel = (action: string) =>
    t('book.chapterActionLabel', { action, title: chapter.title });
  const deleteAction = canDelete ? (
    <ChapterAudioMenu
      label={actionLabel(t('book.moreActions'))}
      onDelete={() => setIsDeleteOpen(true)}
    />
  ) : null;

  return (
    <li
      className={cn(
        'grid min-h-16 items-center gap-x-4 gap-y-2 border-b px-4 py-2.5',
        canEdit
          ? 'grid-cols-[1.25rem_minmax(0,1fr)] md:grid-cols-[1.25rem_minmax(0,1fr)_20rem]'
          : 'grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_20rem]',
        isSelected && 'bg-card',
        audio?.status === 'PROCESSING' && 'shadow-[inset_2px_0_0_var(--brand)]',
      )}
    >
      {canEdit &&
        (isNarrated ? (
          <Checkbox
            checked={isSelected}
            aria-label={t('book.selectChapter', { title: chapter.title })}
            onCheckedChange={(checked) => onSelectionChange(checked === true)}
          />
        ) : (
          <span aria-hidden="true" />
        ))}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            'truncate font-serif text-base leading-snug',
            !isNarrated && 'text-muted-foreground',
          )}
          title={chapter.title}
        >
          {chapter.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('book.chapterNumber', { number: chapter.position + 1 })}
          {` · ${t('book.wordCount', { count: chapter.wordCount })}`}
          {chapter.role !== 'MAIN' && ` · ${t(`book.roles.${chapter.role}`)}`}
        </span>
      </div>

      <div
        className={cn(
          'grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3',
          canEdit ? 'col-span-2 md:col-span-1' : 'col-span-full md:col-span-1',
        )}
      >
        {!isNarrated ? (
          <ChapterNote title={t('book.notNarratedHint')}>
            {t('book.notNarrated')}
          </ChapterNote>
        ) : !audio ? (
          <ChapterNote>{t('book.noAudio')}</ChapterNote>
        ) : audio.status === 'READY' ? (
          <ReadyAudio
            access={audioAccess}
            title={chapter.title}
            voiceName={audio.voiceName ?? undefined}
            menuLabel={actionLabel(t('book.moreActions'))}
            canDelete={canDelete}
            onDelete={() => setIsDeleteOpen(true)}
          />
        ) : (
          <>
            <ChapterAudioProgress audio={audio} />
            {canEdit && (
              <div className="flex gap-1">
                {audio.status === 'QUEUED' || audio.status === 'PROCESSING' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={actionLabel(t('book.stopAudio'))}
                    title={t('book.stopAudio')}
                    disabled={cancelAudio.isPending}
                    onClick={() => {
                      queueAudio.reset();
                      cancelAudio.mutate(pathParams);
                    }}
                  >
                    {cancelAudio.isPending ? (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <CircleStopIcon aria-hidden="true" />
                    )}
                  </Button>
                ) : null}
                {audio.status === 'FAILED' || audio.status === 'CANCELLED' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={actionLabel(t('book.continueAudio'))}
                    title={t('book.continueAudio')}
                    disabled={queueAudio.isPending || !canQueueAudio}
                    onClick={() => {
                      cancelAudio.reset();
                      queueAudio.mutate({ ...pathParams, body: { voiceId } });
                    }}
                  >
                    {queueAudio.isPending ? (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : audio.status === 'FAILED' ? (
                      <RotateCcwIcon aria-hidden="true" />
                    ) : (
                      <PlayIcon aria-hidden="true" />
                    )}
                  </Button>
                ) : null}
                {deleteAction}
              </div>
            )}
          </>
        )}
      </div>

      {mutationError && (
        <p
          className="col-span-full text-[13px] text-destructive-text"
          role="alert"
        >
          {t(getApiErrorTranslationKey(mutationError))}
        </p>
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia variant="destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>{t('book.deleteAudioTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('book.deleteAudioDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAudio.isPending}>
              {t('book.keepAudio')}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              disabled={deleteAudio.isPending}
              onClick={() => deleteAudio.mutate(pathParams)}
            >
              {deleteAudio.isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2Icon aria-hidden="true" />
              )}
              {deleteAudio.isPending
                ? t('book.audioDeleting')
                : t('book.deleteAudio')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function ChapterNote({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      className="col-start-2 text-[13px] text-muted-foreground"
      title={title}
    >
      {children}
    </span>
  );
}

// Delete (and, when there is a file, download) for a chapter's audio.
function ChapterAudioMenu({
  label,
  downloadUrl,
  onDelete,
}: {
  label: string;
  downloadUrl?: string;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={t('book.moreActions')}
          />
        }
      >
        <EllipsisIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {downloadUrl && (
          <>
            <DropdownMenuItem render={<a href={downloadUrl} />}>
              <DownloadIcon aria-hidden="true" />
              {t('book.downloadAudio')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon aria-hidden="true" />
          {t('book.deleteAudio')}…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Queued, generating, failed or stopped: a status icon, its label, the part
// count and a segment-free progress bar.
function ChapterAudioProgress({ audio }: { audio: ChapterAudioResponseDto }) {
  const { t } = useTranslation();
  const progress = getAudioProgress(audio);
  const hasParts = audio.totalChunks > 0;
  const partsLabel = hasParts
    ? t('book.audioPartsShort', {
        completed: audio.completedChunks,
        total: audio.totalChunks,
      })
    : undefined;
  const { icon, label, tone } = getAudioState(audio, t);
  const barValue =
    progress ??
    (hasParts && (audio.status === 'FAILED' || audio.status === 'CANCELLED')
      ? Math.round((100 * audio.completedChunks) / audio.totalChunks)
      : undefined);

  return (
    <>
      <span className={cn('flex size-8 items-center justify-center', tone)}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2 text-xs">
          <span className={cn('truncate font-medium', tone)}>{label}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {audio.status === 'PROCESSING' && !partsLabel && progress
              ? `${progress}%`
              : partsLabel}
          </span>
        </span>
        {barValue !== undefined && (
          <Progress value={barValue} aria-label={label} className="gap-0" />
        )}
      </span>
    </>
  );
}

function getAudioState(
  audio: ChapterAudioResponseDto,
  t: Translate,
): { icon: ReactNode; label: string; tone: string } {
  switch (audio.status) {
    case 'PROCESSING':
      return {
        icon: <LoaderCircleIcon className="animate-spin" aria-hidden="true" />,
        label: getAudioStageLabel(audio.processingStage, t),
        tone: 'text-brand',
      };
    case 'FAILED':
      return {
        icon: <CircleAlertIcon aria-hidden="true" />,
        label: t('book.audioFailed'),
        tone: 'text-destructive-text',
      };
    case 'CANCELLED':
      return {
        icon: <CircleStopIcon aria-hidden="true" />,
        label: t('book.audioCancelled'),
        tone: 'text-muted-foreground',
      };
    case 'DELETING':
      return {
        icon: <LoaderCircleIcon className="animate-spin" aria-hidden="true" />,
        label: t('book.audioDeleting'),
        tone: 'text-muted-foreground',
      };
    default:
      return {
        icon: <ClockIcon aria-hidden="true" />,
        label: t('book.audioQueued'),
        tone: 'text-muted-foreground',
      };
  }
}

function getAudioStageLabel(
  stage: ChapterAudioResponseDto['processingStage'],
  t: Translate,
): string {
  switch (stage) {
    case 'CHUNKING':
      return t('book.audioChunking');
    case 'GENERATING':
      return t('book.audioGenerating');
    case 'MERGING':
      return t('book.audioMerging');
    case 'UPLOADING':
      return t('book.audioUploading');
  }
}

function getAudioProgress(audio: ChapterAudioResponseDto): number | undefined {
  if (audio.status !== 'PROCESSING') {
    return undefined;
  }

  switch (audio.processingStage) {
    case 'CHUNKING':
      return 5;
    case 'GENERATING':
      return audio.totalChunks === 0
        ? 5
        : 5 + Math.round((80 * audio.completedChunks) / audio.totalChunks);
    case 'MERGING':
      return 90;
    case 'UPLOADING':
      return 95;
  }
}

function ReadyAudio({
  access,
  title,
  voiceName,
  menuLabel,
  canDelete,
  onDelete,
}: {
  access: ReturnType<typeof useQuery<ChapterAudioAccessResponseDto>>;
  title: string;
  voiceName: string | undefined;
  menuLabel: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  if (access.isPending) {
    return (
      <span className="col-span-3 flex items-center gap-2 text-[13px] text-muted-foreground">
        <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        {t('book.audioLoading')}
      </span>
    );
  }

  if (access.isError || !access.data) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('common.retry')}
          title={t('common.retry')}
          onClick={() => access.refetch()}
        >
          <RotateCcwIcon aria-hidden="true" />
        </Button>
        <span className="text-[13px] text-destructive-text" role="alert">
          {t(getApiErrorTranslationKey(access.error))}
        </span>
        {canDelete && (
          <ChapterAudioMenu label={menuLabel} onDelete={onDelete} />
        )}
      </>
    );
  }

  return (
    <>
      <ChapterAudioPlayer
        src={access.data.playbackUrl}
        title={title}
        voiceName={voiceName}
        onError={() => {
          void access.refetch();
        }}
      />
      {canDelete ? (
        <ChapterAudioMenu
          label={menuLabel}
          downloadUrl={access.data.downloadUrl}
          onDelete={onDelete}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('book.downloadAudio')}
          title={t('book.downloadAudio')}
          render={
            <a href={access.data.downloadUrl}>
              <DownloadIcon aria-hidden="true" />
            </a>
          }
        />
      )}
    </>
  );
}

// Renders the play button and the middle cell of the audio grid; idle it shows
// the voice and length, once started the position and a seek bar.
function ChapterAudioPlayer({
  src,
  title,
  voiceName,
  onError,
}: {
  src: string;
  title: string;
  voiceName: string | undefined;
  onError: () => void;
}) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasStarted = isPlaying || currentTime > 0;

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  }

  function seek(value: number | readonly number[]) {
    const nextTime = Array.isArray(value) ? value[0] : value;
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(nextTime)) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant={isPlaying ? 'default' : 'outline'}
        aria-label={t('book.chapterActionLabel', {
          action: isPlaying ? t('book.pauseAudio') : t('book.playAudio'),
          title,
        })}
        onClick={() => {
          void togglePlayback();
        }}
      >
        {isPlaying ? (
          <PauseIcon aria-hidden="true" />
        ) : (
          <PlayIcon aria-hidden="true" />
        )}
      </Button>

      {hasStarted ? (
        <div className="flex min-w-0 items-center gap-2.5 text-xs tabular-nums">
          <span>{formatAudioTime(currentTime)}</span>
          <Slider
            min={0}
            max={duration || 1}
            value={[Math.min(currentTime, duration || 0)]}
            disabled={duration <= 0}
            aria-label={t('book.audioSeek')}
            onValueChange={seek}
          />
          <span className="text-muted-foreground">
            {formatAudioTime(duration)}
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <span className="truncate font-serif text-[13px]">
            {voiceName ?? t('book.audioReady')}
          </span>
          {duration > 0 && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatAudioTime(duration)}
            </span>
          )}
        </div>
      )}

      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        src={src}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          onError();
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onPlay={(event) => {
          if (activeAudio && activeAudio !== event.currentTarget) {
            activeAudio.pause();
          }
          activeAudio = event.currentTarget;
          setIsPlaying(true);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
      >
        {t('book.audioUnsupported')}
      </audio>
    </>
  );
}

function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const secondsLabel = String(totalSeconds % 60).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${secondsLabel}`;
  }

  return `${minutes}:${secondsLabel}`;
}
