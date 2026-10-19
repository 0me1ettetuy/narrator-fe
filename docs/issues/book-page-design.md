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

## Desired follow-up

Design and implement a polished book-detail experience that:

- establishes clearer visual hierarchy for the book header and metadata;
- improves the chapter-list density, spacing, and responsive layout;
- defines intentional visuals for queued, parsing, ready, and failed states;
- reserves clear space for upcoming chapter-audio controls and progress;
- remains accessible in light/dark themes and on narrow screens.

## Out of scope for this ticket

- TTS generation, audio playback, and chapter actions;
- backend/API changes;
- changes to the upload or EPUB parsing workflows.
