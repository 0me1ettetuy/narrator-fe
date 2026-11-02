# Local TTS model rollout guard

> **Superseded.** Local models are now disabled entirely, not just gated by
> model. See [`local-tts-models-disabled.md`](local-tts-models-disabled.md).
> This document's `TESTED_LOCAL_MODEL_ID`/`isComingSoonLocalModel` guard is
> now itself commented out as part of that broader change. Kept for history
> and because the per-model rollout decision below may still apply once local
> models are restored.

## Current temporary behavior

Only Piper (`local.piper.en-us-amy`) can be selected in the Models page. Other
local model cards remain visible, dimmed, non-interactive, and marked **Coming
soon**.

The frontend guard is in
[`ModelsPage.tsx`](../../src/pages/models/ui/ModelsPage.tsx) as
`TESTED_LOCAL_MODEL_ID`.

## Why it exists

The backend adapters and Docker definitions for Kokoro, Qwen3 TTS, and
Chatterbox are present, but each must be tested end-to-end before users can
select it. The guard prevents accidental production generation through an
untested adapter.

## Remove or update it after testing a model

For each local model:

1. Enable and start its Docker service.
2. Select the model through the backend API and generate a short chapter.
3. Confirm the resulting chapter audio record reports that local `modelId`,
   provider, and local voice—not Fish Audio.
4. Add its model ID to the frontend allowlist, or remove the temporary guard
   after every local adapter is verified.

This is frontend-only protection. The backend continues to own model
availability and persists the user’s selected model in the database.
