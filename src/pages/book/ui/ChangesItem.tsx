import {
  CheckIcon,
  CircleAlertIcon,
  LoaderCircleIcon,
  PencilIcon,
  Undo2Icon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';

// The Reorganize page's item in the island: unsaved changes (with a warning
// line when saving deletes audio), then the saving step.
export function ChangesItem({
  count,
  summary,
  warning,
  error,
  savingStep,
  isSaving,
  onDiscard,
  onSave,
}: {
  count: number;
  summary: string;
  warning: string | null;
  error: string | null;
  savingStep: string | null;
  isSaving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const detail = error ?? warning;

  return (
    <div
      role="region"
      aria-label={t('book.unsavedChangesRegion')}
      aria-live="polite"
      className="flex items-center gap-3 px-4 py-3"
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center bg-brand text-card"
      >
        <PencilIcon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold">
          {isSaving
            ? t('book.savingCount', { count })
            : t('book.changeCount', { count })}
        </span>
        {detail && !isSaving ? (
          <span className="flex items-center gap-1.5 text-[13px] text-[#ef6a60] dark:text-[#a3161c]">
            <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{detail}</span>
          </span>
        ) : (
          <span className="truncate font-serif text-[13px] opacity-65">
            {isSaving ? savingStep : summary}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-background/25 text-background hover:bg-background/10 hover:text-background"
          disabled={isSaving}
          onClick={onDiscard}
        >
          <Undo2Icon aria-hidden="true" />
          {t('book.discard')}
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-background text-foreground hover:bg-background/90"
          disabled={isSaving}
          onClick={onSave}
        >
          {isSaving ? (
            <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckIcon aria-hidden="true" />
          )}
          {isSaving ? t('book.saving') : t('book.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
