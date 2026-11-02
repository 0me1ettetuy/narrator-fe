import type { TtsModelResponseDto, TtsModelsResponseDto } from '@/shared/api';

// Local models are disabled; see docs/issues/local-tts-models-disabled.md.
// Uncomment to restore:
// export const TESTED_LOCAL_MODEL_ID = 'local.piper.en-us-amy';

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

// export function isLocalModelSelectable(model: TtsModelResponseDto): boolean {
//   return (
//     model.selectable &&
//     (model.source !== 'LOCAL' || model.id === TESTED_LOCAL_MODEL_ID)
//   );
// }
