import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InfoIcon, LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorTranslationKey,
  ttsModelsControllerDeleteFishVoiceMutation,
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSelectFishVoiceMutation,
  type FishVoiceResponseDto,
} from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { FishVoiceForm } from './FishVoiceForm';

type FishVoiceManagerProps = {
  voices: FishVoiceResponseDto[];
  disabled?: boolean;
};

export function FishVoiceManager({
  voices,
  disabled = false,
}: FishVoiceManagerProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ttsModelsControllerListModelsQueryKey(),
    });
  };
  const selectVoice = useMutation({
    ...ttsModelsControllerSelectFishVoiceMutation(),
    onSuccess: refresh,
  });
  const deleteVoice = useMutation({
    ...ttsModelsControllerDeleteFishVoiceMutation(),
    onSuccess: refresh,
  });
  const selectedVoice = voices.find((voice) => voice.selected);
  const isInteractionDisabled =
    disabled || selectVoice.isPending || deleteVoice.isPending;
  // A voice the backend has archived (e.g. its .env default was removed) is
  // no longer a real option; the backend clears any selection pointing at
  // it, so there's nothing left to show it as here either.
  const visibleVoices = voices.filter((voice) => voice.enabled);

  function chooseVoice(id: string) {
    selectVoice.reset();
    selectVoice.mutate({ body: { id } });
  }

  return (
    <Card
      className={cn('gap-0 py-0', disabled && 'opacity-55')}
      aria-labelledby="fish-voices-title"
      aria-disabled={disabled}
    >
      <div className="flex items-center gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <h3 id="fish-voices-title" className="text-base font-semibold">
            {t('models.voicesTitle')}
          </h3>
          <p className="font-serif text-sm text-muted-foreground">
            {t('models.voicesDescription')}
          </p>
        </div>
        <span className="text-[13px] text-muted-foreground">
          {t('models.voiceCount', { count: visibleVoices.length })}
        </span>
      </div>

      {disabled && (
        <div
          role="note"
          className="mx-4 mb-4 flex items-center gap-2.5 px-4 py-3.5 text-sm ring-1 ring-border"
        >
          <InfoIcon className="size-4 shrink-0" aria-hidden="true" />
          {t('models.selectFishModel')}
        </div>
      )}

      {(selectVoice.error || deleteVoice.error) && (
        <div className="space-y-2 px-4 pb-4">
          {selectVoice.error && (
            <Alert variant="destructive">
              <AlertTitle>{t('models.voiceSelectionFailed')}</AlertTitle>
              <AlertDescription>
                {t(getApiErrorTranslationKey(selectVoice.error))}
              </AlertDescription>
            </Alert>
          )}
          {deleteVoice.error && (
            <Alert variant="destructive">
              <AlertTitle>{t('models.voiceDeletionFailed')}</AlertTitle>
              <AlertDescription>
                {t(getApiErrorTranslationKey(deleteVoice.error))}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {visibleVoices.length > 0 ? (
        <RadioGroup
          aria-label={t('models.voiceList')}
          className="gap-0"
          value={selectedVoice?.id ?? null}
          disabled={isInteractionDisabled}
          onValueChange={(id) => chooseVoice(String(id))}
        >
          {visibleVoices.map((voice) => {
            const isDeletingVoice =
              deleteVoice.isPending &&
              deleteVoice.variables?.path.voiceId === voice.id;

            return (
              <div
                key={voice.id}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto_2rem] items-center gap-x-3 border-t px-4 py-3"
              >
                <RadioGroupItem
                  value={voice.id}
                  aria-label={t('models.useVoice', { name: voice.name })}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-serif text-base">
                    {voice.name}
                    {voice.selected && (
                      <span className="font-sans text-xs font-semibold text-brand">
                        {' · '}
                        {t('models.defaultVoice')}
                      </span>
                    )}
                  </span>
                  <code
                    className="truncate font-mono text-xs text-muted-foreground"
                    title={voice.referenceId}
                  >
                    {shortenId(voice.referenceId)}
                  </code>
                </span>
                <Badge variant="outline">
                  {voice.source === 'DEFAULT'
                    ? t('models.sharedVoice')
                    : t('models.customVoice')}
                </Badge>
                {voice.source === 'CUSTOM' ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive-text hover:text-destructive-text"
                    aria-label={t('models.removeVoiceNamed', {
                      name: voice.name,
                    })}
                    title={t('models.removeVoice')}
                    disabled={isInteractionDisabled}
                    onClick={() => {
                      deleteVoice.reset();
                      deleteVoice.mutate({ path: { voiceId: voice.id } });
                    }}
                  >
                    {isDeletingVoice ? (
                      <LoaderCircleIcon
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2Icon aria-hidden="true" />
                    )}
                  </Button>
                ) : (
                  <span />
                )}
              </div>
            );
          })}
        </RadioGroup>
      ) : (
        <p className="border-t p-4 text-sm text-muted-foreground">
          {t('models.defaultVoiceDescription')}
        </p>
      )}

      <div className="border-t p-4">
        <FishVoiceForm disabled={isInteractionDisabled} />
      </div>
    </Card>
  );
}

// Reference IDs are long hashes; the full value stays in the tooltip.
function shortenId(id: string) {
  return id.length > 12 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}
