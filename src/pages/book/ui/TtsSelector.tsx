import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  CheckIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  LoaderCircleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ttsModelsControllerListModelsQueryKey,
  ttsModelsControllerSelectFishVoiceMutation,
  ttsModelsControllerSelectModelMutation,
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  const selectModel = useMutation({
    ...ttsModelsControllerSelectModelMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });
  const selectVoice = useMutation({
    ...ttsModelsControllerSelectFishVoiceMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ttsModelsControllerListModelsQueryKey(),
      });
    },
  });

  const fishModels =
    models?.groups.find((group) => group.id === 'fish-audio')?.models ?? [];
  const fishCredential = models?.providers.find(
    (provider) => provider.id === 'fish-audio',
  );
  const { selectedModel, isFishSelected, isVoiceSelected } =
    getTtsSelection(models);
  const selectedVoiceName = fishCredential?.voices.find(
    (voice) => voice.selected,
  )?.name;

  function handleSelectModel(modelId: string) {
    selectModel.reset();
    selectModel.mutate({ body: { modelId } });
  }

  function handleSelectVoice(voiceId: string) {
    selectVoice.reset();
    selectVoice.mutate({ body: { id: voiceId } });
  }

  const isMutating = selectModel.isPending || selectVoice.isPending;
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
        {fishCredential?.credentialState === 'VALID' ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span className="flex-1 truncate">
                {t('book.ttsSelector.fishAudio')}
              </span>
              {isFishSelected && <CheckIcon aria-hidden="true" />}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('book.ttsSelector.fishModel')}
                </DropdownMenuLabel>
                {fishModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    disabled={!model.selectable || isMutating}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <span className="flex-1 truncate">{model.displayName}</span>
                    {model.id === models?.selectedModelId && (
                      <CheckIcon aria-hidden="true" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {t('book.ttsSelector.fishVoice')}
                </DropdownMenuLabel>
                {fishCredential.voices.map((voice) => (
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem render={<Link to="/models" />}>
            {t('book.ttsSelector.addFishKey')}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Local models disabled; see docs/issues/local-tts-models-disabled.md
            for why. Per-model rendering commented out, not deleted, for
            restoration (it depended on isLocalModelSelectable/
            TESTED_LOCAL_MODEL_ID from tts-selection.ts, also commented
            there):
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t('book.ttsSelector.localModels')}
          </DropdownMenuLabel>
          {localModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              disabled={!isLocalModelSelectable(model) || isMutating}
              onClick={() => handleSelectModel(model.id)}
            >
              <span className="flex-1 truncate">{model.displayName}</span>
              {model.id === models?.selectedModelId && (
                <CheckIcon aria-hidden="true" />
              )}
              {model.selectable && model.id !== TESTED_LOCAL_MODEL_ID && (
                <span className="text-xs text-muted-foreground">
                  {t('book.ttsSelector.comingSoon')}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {t('book.ttsSelector.localModels')}
          </DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <span className="flex-1 truncate text-muted-foreground">
              {t('book.ttsSelector.comingSoon')}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
