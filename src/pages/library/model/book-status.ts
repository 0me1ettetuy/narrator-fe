import type { useTranslation } from 'react-i18next';
import type { BookSummaryResponseDto } from '@/shared/api';

export function getStatusLabel(
  status: BookSummaryResponseDto['parseStatus'],
  t: ReturnType<typeof useTranslation>['t'],
): string | null {
  switch (status) {
    case 'UPLOADING':
      return t('library.statusUploading');
    case 'QUEUED':
      return t('library.statusQueued');
    case 'PROCESSING':
      return t('library.statusProcessing');
    case 'FAILED':
      return t('library.statusFailed');
    case 'READY':
      return null;
  }
}
