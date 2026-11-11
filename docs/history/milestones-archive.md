# Frontend milestones archive

Older milestones, moved out of [`../history.md`](../history.md) to keep it short. Same format; append here only when archiving.

### 31 October — production-style frontend delivery

- Added a multi-stage frontend image: it generates the ignored OpenAPI/TanStack
  client from the running backend during image build, builds the Vite SPA, and
  serves the immutable result through Nginx with SPA-route fallback.
- Added a separate frontend Compose project. It joins the backend-created
  `narrator-network` only to reach `http://api:3000` while generating types;
  the browser bundle continues to use the separately configured public
  `VITE_BACKEND_URL`.
- Added the frontend deployment environment example and pinned pnpm 10.29.2 to
  match the backend and keep Docker builds reproducible.

### 26 August — Vite foundation, UI primitives, and routing/state libraries

- Created the React, TypeScript, and Vite application with the `@` alias,
  Prettier, ESLint, editor recommendations, and template cleanup.
- Added the shadcn component set and the common UI utility/mobile-hook
  infrastructure.
- Added TanStack Query with its root client/provider and TanStack Router with
  file-based root, home, and about routes. Generated route output was excluded
  from linting/formatting.

### 29 September — Feature-Sliced Design migration

- Replaced the starter application structure with FSD layers.
- Moved route composition under `app`, reusable primitives into `shared/ui`,
  base pages into `pages`, and app-wide styles/providers into `app`.

### 6–13 October — authenticated application shell and frontend foundations

- Added OpenAPI/Hey API configuration, centralized API transport, session
  bootstrap, in-memory access/CSRF session state, and auth helpers.
- Added public and authenticated route layouts; login, registration, hero,
  home, about, and not-found pages; public and authorized headers; collapsible
  authorized sidebar; breadcrumb support; and persisted theme preference.
- Added English/Russian i18next infrastructure, localized API error mapping,
  toasts, reusable loading/error/empty states, a route-error page, and
  TanStack Form + Zod validation for authentication.
- Added frontend agent guidance, architecture documentation, and delivery
  checks.

### 19–20 October — library, direct EPUB upload, and chapter audio controls

- Added protected Library and Book routes, upload-form flow, book-card list,
  loading skeletons, and book detail data composition.
- Added chapter audio-generation controls, status/progress display, stop and
  deletion actions, signed-audio playback/download, and the API client support
  needed by those interactions.

### 25–28 October — model selection, covers, and chapter curation

- Added the Models page, Fish credential form, model selection interface,
  localized API error behavior, and a documented interim book-progress polling
  approach.
- Added select-all/select-some chapter generation UX plus EPUB cover artwork
  on library cards and book detail.
- Added the chapter-curation editor/panel and model layer for title/text,
  tag, merge, delete, and narration-related chapter management, together with
  its interaction plan.
- Reorganized frontend documentation into architecture, books, features, and
  issues domains.

### 30 October — book workflow refinements and Fish voice management

- Refined the library, upload dialog, book page, model page, shared checkbox,
  and authenticated header behavior; this was a cross-page usability pass, not
  a new backend capability.
- Added the Fish voice-management UI: users can add labeled custom reference
  voices, select a default or owned custom voice, and remove custom voices.
  The book page exposes the voice recorded for generated chapter audio.

### 31 October — audio status, model rollout, and failure-state refinements

- Book detail now displays declared EPUB language and resolves generated Fish
  voice IDs to their saved human-friendly voice names.
- Deleting or re-queueing chapter audio clears the cached signed playback URL,
  preventing a stale browser/player URL from representing replacement audio.
- Fish voice controls are collapsed by default and inactive unless a Fish model
  is selected. Until each local adapter is verified end-to-end, only Piper is
  selectable and other local cards show **Coming soon**.
- Reworked the shared data error state into a clear retryable empty-state UI;
  documented the temporary local-model rollout guard.

### 31 October — book-cover viewing and replacement

- The book page now presents a slightly larger cover. Clicking an existing
  cover opens a viewport-constrained full-image dialog, while the close control
  belongs to the image-sized dialog rather than an unrelated wide container.
- A small tooltip-labelled edit control on the cover opens a replacement flow
  that mirrors the EPUB upload dialog: a dashed picker, selected-image card,
  thumbnail, removal control, and full-width save action.
- The replacement mutation refreshes the book detail, signed-cover URL, and
  library-card caches so the new private object appears without a reload.

### 31 October — library author metadata

- Library cards now prefer the ordered EPUB author names returned in the book
  list over the uploaded filename. Books without author metadata retain a
  localized unknown-author fallback.

### 3 November — explicit TTS selection and book deletion

- Added a compact model/voice dropdown next to the book page's **Generate**
  button: Fish Audio first (a nested submenu with model tiers and voices), then
  local models, or a link to the Models page when no Fish key is saved. It
  writes through the same selection mutations as the Models page.
- **Generate** and the per-chapter retry action are disabled, with an inline
  explanation, until a model and (for Fish) a voice are selected, matching the
  backend's removal of its implicit fallbacks. Added EN/RU messages for
  `TTS_MODEL_NOT_SELECTED` and `FISH_VOICE_NOT_SELECTED`.
- Added book deletion as the first `features/` slice (`features/delete-book`),
  used by the library card (an icon beside, not inside, the card link) and the
  book page header. After confirmation it leaves the book page, drops every
  cached query scoped to the book, refreshes the library, and treats an
  already-deleted book as success.
