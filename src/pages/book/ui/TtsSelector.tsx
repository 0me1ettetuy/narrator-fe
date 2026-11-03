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
// Local models are disabled; see docs/issues/local-tts-models-disabled.md.
// isLocalModelSelectable/TESTED_LOCAL_MODEL_ID stay exported from
// tts-selection.ts (commented there too) for restoration.
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
}: {
  models: TtsModelsResponseDto | undefined;
  isLoading: boolean;
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

  // No valid Fish key yet: there is nothing real to pick (local models are
  // disabled), so a one-item dropdown just adds a wasted click. Link straight
  // to setup instead. `models` is only undefined while loading, which keeps
  // the normal (disabled, spinner) trigger below during that window.
  if (models && fishCredential?.credentialState !== 'VALID') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="max-w-56"
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
        className="max-w-56"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="max-w-56"
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

        {/* Local models disabled; see docs/issues/local-tts-models-disabled.md
            for the full restoration record and the local-voice-selection TODO.
            Earlier revisions of this file (see git history) rendered a
            selectable local-models group here; superseded now that model
            choice lives on the Models page only. */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
