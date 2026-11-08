import { useState } from 'react';
import type {
  TtsLocalVoiceResponseDto,
  TtsModelResponseDto,
} from '@/shared/api';

const STORAGE_KEY = 'narrator.local-tts-voices';

export type LocalVoiceSelection = {
  voices: TtsLocalVoiceResponseDto[];
  voiceId: string | null;
  selectVoice: (voiceId: string) => void;
};

/**
 * Local models have a fixed voice list per language, so the choice is a
 * per-browser preference sent with each generate request (nothing is stored on
 * the user). Until the user picks one, the first listed voice is the default.
 */
export function useLocalVoice(
  selectedModel: TtsModelResponseDto | undefined,
  bookLanguage: string | null,
): LocalVoiceSelection {
  const [stored, setStored] = useState(readStoredVoices);
  const language = bookLanguage?.trim().toLowerCase().split(/[-_]/, 1)[0];
  const voices =
    selectedModel?.source === 'LOCAL'
      ? selectedModel.voices.filter((voice) => voice.language === language)
      : [];
  const storedId = language ? stored[language] : undefined;
  const voiceId =
    voices.find((voice) => voice.id === storedId)?.id ?? voices[0]?.id ?? null;

  function selectVoice(nextVoiceId: string) {
    if (!language) {
      return;
    }

    const next = { ...stored, [language]: nextVoiceId };

    setStored(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the choice then lasts until reload.
    }
  }

  return { voices, voiceId, selectVoice };
}

function readStoredVoices(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '{}',
    );

    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}
