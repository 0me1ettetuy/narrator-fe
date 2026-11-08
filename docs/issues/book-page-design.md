# Book page design: deferred UI work

## Status

Deferred frontend design work. The book page correctly loads and displays book
metadata, parse status, and chapters, but its visual design is intentionally a
functional first pass.

## Current behavior

The page provides:

- a `Library / Book` breadcrumb;
- title, authors, source filename, source size, parse status, and chapter
  count;
- chapter cards with position, title, and word count;
- loading, parsing, ready, and failed states.

## Audio-generation section

The chapter-TTS API and a first-pass generation UI now exist (model selector,
local voice dropdown, per-chapter and batch generate). The target design for
this section is below; it should be driven entirely by the persisted audio/job state returned from the
book-detail query, so a browser refresh simply refetches progress.

- A book-level action: generate eligible chapters, with aggregate stage and
  `completed / total` progress.
- Per-chapter actions: generate, generating/progress, retry after failure,
  and ready/player states.
- Clear labels for the pipeline stages: chunking, generating audio, merging
  parts, uploading final audio, and failed/ready.
- Poll the book query only while at least one relevant audio/job state is
  active; stop at terminal states and refetch normally on window focus.
- Never show temporary R2 part keys or provider errors. Only show a stable,
  user-safe error state and retry action.

## Desired follow-up

Design and implement a polished book-detail experience that:

- establishes clearer visual hierarchy for the book header and metadata;
- improves the chapter-list density, spacing, and responsive layout;
- defines intentional visuals for queued, parsing, ready, and failed states;
- integrates the audio-generation section without making chapter cards noisy;
- remains accessible in light/dark themes and on narrow screens.

## Progress

- Responsive pass done in code for the book page: header metadata wraps,
  the batch toolbar stacks full-width controls below `lg`, chapter cards and
  audio status rows wrap instead of squeezing. Not yet checked in a browser
  at 375px.
- Visual hierarchy, chapter-list density and state visuals above are still
  open.

## Out of scope for this ticket

- backend/API implementation;
- changes to the upload or EPUB parsing workflows.
