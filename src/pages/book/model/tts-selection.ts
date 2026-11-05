import type { TtsModelResponseDto, TtsModelsResponseDto } from '@/shared/api';

export type TtsSelection = {
  selectedModel: TtsModelResponseDto | undefined;
  isFishSelected: boolean;
  isVoiceSelected: boolean;
  isComplete: boolean;
};

export function getTtsSelection(
  models: TtsModelsResponseDto | undefined,
): TtsSelection {
  const allModels = (models?.groups ?? []).flatMap((group) => group.models);
  const selectedModel = allModels.find(
    (model) => model.id === models?.selectedModelId,
  );
  const isFishSelected = selectedModel?.source === 'FISH';
  const fishCredential = models?.providers.find(
    (provider) => provider.id === 'fish-audio',
  );
  const isVoiceSelected =
    fishCredential?.voices.some((voice) => voice.selected) ?? false;

  return {
    selectedModel,
    isFishSelected,
    isVoiceSelected,
    isComplete: !!selectedModel && (!isFishSelected || isVoiceSelected),
  };
}
