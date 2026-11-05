# Local TTS models: temporarily disabled

## Status

Update: Qwen3-TTS 0.6B is restored. The Models page renders the local group again, and `TtsSelector` shows a local model as a disabled label. Piper, Kokoro-82M and Chatterbox Turbo remain disabled, and the rest of this record still describes them.

Deferred. Supersedes
[`local-tts-model-rollout.md`](local-tts-model-rollout.md): that issue was
about gating individual untested local models behind a rollout guard; this
one is the whole local-models feature being disabled so the product can focus
on Fish Audio only.

## What changed

- `TtsSelector.tsx` (the dropdown next to the book page's **Generate**
  button): the local-models `DropdownMenuGroup` that rendered one item per
  model is commented out. An active replacement renders the group's label
  with a disabled **Coming soon** item in its place.
- `TtsSelector.tsx` was later restructured so model choice only happens on
  the Models page: the dropdown no longer lists models or lets you change
  one (it links to `/models` instead when no model is selected). It only
  shows the current model's name as a label and lets you pick a voice. The
  stale local-models restoration markup this doc used to describe inline was
  replaced with a short pointer here; see git history for that file if the
  old per-model item markup is useful again. See also the
  **local-voice-selection** TODO below — it changes how local models should
  pick a voice once restored, not just how they're listed.
- `tts-selection.ts`: `TESTED_LOCAL_MODEL_ID` and `isLocalModelSelectable`
  (the old per-model rollout guard this doc's predecessor described) are
  commented out, since nothing calls them anymore.
- `ModelsPage.tsx` (`/models`): the dynamic local-models `ModelGroup` (one
  card per model, with per-model selectable/coming-soon state) is commented
  out. An active replacement renders the same "Local models" heading with a
  static **Coming soon** card. `ModelCard`'s local-vs-Fish branching
  (`isComingSoonLocalModel`) is commented out too — it now only ever renders
  Fish model cards.
- New EN/RU strings: `models.localComingSoonDescription`.

Nothing was deleted; every change above is a comment, reversible by deleting
the comment markers and the small static replacement block next to each one.

## Why

Backend TTS adapters, Docker services, and env config for local models
(Piper, Kokoro-82M, Qwen3-TTS, Chatterbox Turbo) were removed/commented out
on the same date. See the backend's
[`docs/issues/local-tts-models-disabled.md`](../../../narrator-general-api/docs/issues/local-tts-models-disabled.md)
and
[`docs/tts/local-tts-models-removed.md`](../../../narrator-general-api/docs/tts/local-tts-models-removed.md)
for the full backend restoration record. This frontend change keeps the UI
honest with that: `GET /tts/models` now always returns an empty `local`
group, so the previous dynamic rendering would have shown an empty section
anyway.

## Restoring

1. Restore the backend first (see the backend doc above) so `GET /tts/models`
   can return real local models again.
2. In each file listed above, delete the comment markers around the original
   code and delete the small static "coming soon" replacement next to it.
3. Decide whether the old per-model rollout guard
   (`local-tts-model-rollout.md`) still applies, or whether every local
   adapter has since been verified and the guard should be removed outright.

## TODO: local-voice-selection by book language

Not implemented, deliberately deferred. Fish Audio voices are a free choice —
any voice works with any text, so the user always picks one explicitly and
nothing is auto-selected (no silent fallback, anywhere in this product).
Local models are different: each is trained on one language's voice(s), so an
English voice can't narrate Russian text. When local models come back:

- Each local model should carry its own language-bound voice (or small set of
  voices), not a free Fish-style voice list.
- `TtsSelector`'s dropdown should show that voice as already set — based on
  the book's declared/detected language — and non-interactive, since there's
  nothing to choose among exactly one valid option. Only Fish keeps an
  explicit, clickable voice picker.
- This is still "select, don't guess": if a local model has no voice for the
  book's language, treat that the same as incomplete (disable Generate, show
  the existing `book.ttsSelector.selectionIncomplete` alert) rather than
  falling back to a mismatched-language voice.
