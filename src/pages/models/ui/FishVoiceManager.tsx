import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
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
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
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
  const [isOpen, setIsOpen] = useState(false);
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn('gap-0 py-0', disabled && 'opacity-55')}
        aria-disabled={disabled}
      >
        <CollapsibleTrigger
          className="flex w-full cursor-pointer items-center gap-4 p-4 text-left outline-none"
          aria-label={
            isOpen ? t('models.collapseVoices') : t('models.expandVoices')
          }
        >
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
              {t('models.defaultVoiceLabel')}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-2.5">
              <span className="font-serif text-lg">
                {selectedVoice?.name ?? t('models.defaultVoiceTitle')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('models.voiceMeta', { count: visibleVoices.length })}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.06em] uppercase">
            {isOpen ? t('models.close') : t('models.change')}
            <ChevronDownIcon
              className={cn('size-3.5', isOpen && 'rotate-180')}
              aria-hidden="true"
            />
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {disabled && (
            <p className="px-4 pb-3 text-[13px] text-muted-foreground">
              {t('models.selectFishModel')}
            </p>
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
              aria-label={t('models.defaultVoiceLabel')}
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
                      </span>
                      <code
                        className="truncate font-mono text-xs text-muted-foreground"
                        title={voice.referenceId}
                      >
                        {shortenId(voice.referenceId)}
                      </code>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {voice.source === 'DEFAULT'
                        ? t('models.sharedVoice')
                        : t('models.customVoice')}
                    </span>
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Reference IDs are long hashes; the full value stays in the tooltip.
function shortenId(id: string) {
  return id.length > 12 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}
