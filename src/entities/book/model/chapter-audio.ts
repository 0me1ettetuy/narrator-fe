import type { useTranslation } from 'react-i18next';
import type { ChapterAudioResponseDto } from '@/shared/api';

type Translate = ReturnType<typeof useTranslation>['t'];

export function getAudioStageLabel(
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

export function getAudioProgress(
  audio: ChapterAudioResponseDto,
): number | undefined {
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
