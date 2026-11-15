import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  KeyRoundIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSelectFishVoiceMutation,
  type TtsModelsResponseDto,
} from '@/shared/api';
import type { LocalVoiceSelection } from '../model/local-voice';
import { getTtsSelection } from '../model/tts-selection';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export function TtsSelector({
  models,
  isLoading,
  localVoice,
}: {
  models: TtsModelsResponseDto | undefined;
  isLoading: boolean;
  localVoice: LocalVoiceSelection;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Picking a *model* is a Models-page-only action now; this control only
  // ever changes the voice. See docs/issues/local-tts-models-disabled.md for
  // why local models, which bind one voice per language instead of Fish's
  // free choice, aren't wired up here yet.
  const selectVoice = useMutation({
    ...ttsModelsControllerSelectFishVoiceMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });

  const fishCredential = models?.providers.find(
    (provider) => provider.id === 'fish-audio',
  );
  const { selectedModel, isFishSelected, isVoiceSelected } =
    getTtsSelection(models);
  const selectedVoiceName = fishCredential?.voices.find(
    (voice) => voice.selected,
  )?.name;

  function handleSelectVoice(voiceId: string) {
    selectVoice.reset();
    selectVoice.mutate({ body: { id: voiceId } });
  }

  const isMutating = selectVoice.isPending;
  const isIncomplete = !selectedModel || (isFishSelected && !isVoiceSelected);
  const triggerLabel = isLoading
    ? t('book.ttsSelector.loading')
    : !selectedModel
      ? t('book.ttsSelector.placeholder')
      : isFishSelected
        ? `${selectedModel.displayName} · ${
            isVoiceSelected
              ? selectedVoiceName
              : t('book.ttsSelector.voiceNeeded')
          }`
        : selectedModel.displayName;

  // No valid Fish key and no local model picked: link straight to setup
  // rather than opening an empty dropdown. A selected local model needs no
  // key. `models` is only undefined while loading, which keeps the normal
  // (disabled, spinner) trigger below during that window.
  if (
    models &&
    (!selectedModel || isFishSelected) &&
    fishCredential?.credentialState !== 'VALID'
  ) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-none lg:w-auto lg:max-w-56"
        render={<Link to="/models" />}
      >
        <KeyRoundIcon className="shrink-0" aria-hidden="true" />
        <span className="truncate">{t('book.ttsSelector.addFishKey')}</span>
      </Button>
    );
  }

  // Credential is valid but no model is picked yet: model choice now only
  // happens on the Models page, so there's nothing to open here either.
  if (models && !selectedModel) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full max-w-none lg:w-auto lg:max-w-56"
        render={<Link to="/models" />}
      >
        <CircleAlertIcon
          className="shrink-0 text-destructive"
          aria-hidden="true"
        />
        <span className="truncate">{t('book.ttsSelector.chooseModel')}</span>
      </Button>
    );
  }

  // A local model lists a fixed set of voices per book language: pick one.
  if (
    models &&
    selectedModel &&
    !isFishSelected &&
    localVoice.voices.length > 0
  ) {
    const currentVoice = localVoice.voices.find(
      (voice) => voice.id === localVoice.voiceId,
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full max-w-none lg:w-auto lg:max-w-56"
            >
              <span className="truncate">
                {`${selectedModel.displayName} · ${currentVoice?.displayName ?? ''}`}
              </span>
              <ChevronDownIcon className="shrink-0" aria-hidden="true" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{selectedModel.displayName}</DropdownMenuLabel>
            {localVoice.voices.map((voice) => (
              <DropdownMenuItem
                key={voice.id}
                onClick={() => localVoice.selectVoice(voice.id)}
              >
                <span className="flex-1 truncate">{voice.displayName}</span>
                {voice.id === localVoice.voiceId && (
                  <CheckIcon aria-hidden="true" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // A local model without voices for this book's language (or none listed)
  // shows its name as a disabled label instead of an empty dropdown.
  if (models && selectedModel && !isFishSelected) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="w-full max-w-none lg:w-auto lg:max-w-56"
      >
        <span className="truncate">{selectedModel.displayName}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="w-full max-w-none lg:w-auto lg:max-w-56"
          >
            {isLoading ? (
              <LoaderCircleIcon
                className="shrink-0 animate-spin"
                aria-hidden="true"
              />
            ) : isIncomplete ? (
              <CircleAlertIcon
                className="shrink-0 text-destructive"
                aria-hidden="true"
              />
            ) : null}
            <span className="truncate">{triggerLabel}</span>
            <ChevronDownIcon className="shrink-0" aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        {/* The model itself (shown as this group's label) isn't a pickable
            item here — only the voice list below is. Switching models is a
            Models-page-only action; see the comment on `selectVoice` above. */}
        {isFishSelected && fishCredential && selectedModel && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{selectedModel.displayName}</DropdownMenuLabel>
            {fishCredential.voices
              .filter((voice) => voice.enabled || voice.selected)
              .map((voice) => (
                <DropdownMenuItem
                  key={voice.id}
                  disabled={!voice.enabled || isMutating}
                  onClick={() => handleSelectVoice(voice.id)}
                >
                  <span className="flex-1 truncate">{voice.name}</span>
                  {voice.selected && <CheckIcon aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
