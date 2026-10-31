import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AudioLinesIcon,
  ChevronDownIcon,
  LoaderCircleIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getApiErrorTranslationKey,
  ttsModelsControllerDeleteFishVoiceMutation,
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSelectFishVoiceMutation,
  type FishVoiceResponseDto,
} from '@/shared/api';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
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
  const selectVoice = useMutation({
    ...ttsModelsControllerSelectFishVoiceMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const deleteVoice = useMutation({
    ...ttsModelsControllerDeleteFishVoiceMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const selectedVoice = voices.find((voice) => voice.selected);
  const isMutating = selectVoice.isPending || deleteVoice.isPending;
  const isInteractionDisabled = disabled || isMutating;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        size="sm"
        className={`gap-3 transition-opacity ${disabled ? 'opacity-55' : ''}`}
        aria-disabled={disabled}
      >
        <CardHeader className={isOpen ? 'border-b' : undefined}>
          <CardTitle className="flex items-center gap-2">
            <AudioLinesIcon className="size-4" aria-hidden="true" />
            {t('models.voicesTitle')}
          </CardTitle>
          <CardDescription>{t('models.voicesDescription')}</CardDescription>
          <CardAction>
            <CollapsibleTrigger
              disabled={disabled}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed"
              aria-label={
                isOpen ? t('models.collapseVoices') : t('models.expandVoices')
              }
              title={
                isOpen ? t('models.collapseVoices') : t('models.expandVoices')
              }
            >
              <ChevronDownIcon
                className={`size-4 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {voices.length > 0 ? (
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] sm:items-center">
                <div>
                  <Label htmlFor="fish-voice-selection">
                    {t('models.selectVoice')}
                  </Label>
                  {!selectedVoice && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t('models.defaultVoiceDescription')}
                    </p>
                  )}
                </div>
                <Select
                  value={selectedVoice?.id}
                  disabled={isInteractionDisabled}
                  onValueChange={(id) => {
                    if (!id) {
                      return;
                    }

                    selectVoice.reset();
                    selectVoice.mutate({ body: { id } });
                  }}
                >
                  <SelectTrigger
                    id="fish-voice-selection"
                    className="w-full sm:max-w-sm"
                  >
                    <SelectValue placeholder={t('models.selectVoice')}>
                      {selectedVoice ? getVoiceLabel(selectedVoice) : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem
                        key={voice.id}
                        value={voice.id}
                        disabled={!voice.enabled}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate">
                            {getVoiceLabel(voice)}
                          </span>
                          {voice.source === 'DEFAULT' && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {t('models.defaultVoice')}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-foreground/10">
                  <AudioLinesIcon className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium">{t('models.defaultVoiceTitle')}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t('models.defaultVoiceDescription')}
                  </p>
                </div>
              </div>
            )}

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

            {voices.length > 0 && (
              <ul
                className="divide-y rounded-lg border"
                aria-label={t('models.voiceList')}
              >
                {voices.map((voice) => {
                  const label = getVoiceLabel(voice);
                  const isDeletingVoice =
                    deleteVoice.isPending &&
                    deleteVoice.variables?.path.voiceId === voice.id;

                  return (
                    <li
                      key={voice.id}
                      className="flex items-center justify-between gap-3 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium" title={label}>
                            {label}
                          </p>
                          <Badge variant="secondary">
                            {voice.source === 'DEFAULT'
                              ? t('models.defaultVoice')
                              : t('models.customVoice')}
                          </Badge>
                          {voice.selected && (
                            <Badge variant="outline">
                              {t('models.selected')}
                            </Badge>
                          )}
                          {!voice.enabled && (
                            <Badge variant="outline">
                              {t('models.voiceUnavailable')}
                            </Badge>
                          )}
                        </div>
                        <code
                          className="block truncate text-xs text-muted-foreground"
                          title={voice.referenceId}
                        >
                          {voice.referenceId}
                        </code>
                      </div>
                      {voice.source === 'CUSTOM' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-destructive hover:text-destructive"
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
                          {t('models.removeVoice')}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t pt-4">
              <FishVoiceForm disabled={isInteractionDisabled} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function getVoiceLabel(voice: FishVoiceResponseDto) {
  return voice.name;
}
