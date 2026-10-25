# Issue: reduce book audio-progress polling

## Current behavior

`pages/book/ui/BookPage.tsx` polls `GET /books/:bookId` every second while:

- the EPUB parse status is `QUEUED` or `PROCESSING`; or
- any chapter audio is `QUEUED`, `PROCESSING`, or `DELETING`.

The response contains the whole book detail: book metadata, every chapter, and
every chapter's audio status. It is simple and reliable for the first version,
but becomes wasteful for books with many chapters or many active readers.

## Why address it later

- One browser tab makes up to 60 full book-detail requests per minute.
- The response grows with chapter count even when only one audio job changes.
- Multiple open tabs/users multiply database and API reads.

## Direction to evaluate

Keep the initial page load as `GET /books/:bookId`, then replace active-job
updates with one of these, in this order:

1. A small status endpoint returning only active parse/audio state and progress
   for the current book or its active chapters. Poll it less frequently and
   invalidate the full book query on a terminal state.
2. Server-Sent Events (SSE) for worker status changes. It is one-way and a
   simpler fit than WebSockets for progress updates.
3. WebSockets only if the product later needs real-time two-way features.

Do not remove polling until the replacement preserves reload recovery,
background-worker retries, cancellation/deletion states, and the final refresh
to the ready audio URL.

## Acceptance criteria

- No one-second whole-book-detail polling during active work.
- UI still resumes correct status after a reload.
- Terminal state (`READY`, `FAILED`, `CANCELLED`, deleted) updates the card
  without a manual refresh.
- Requests stop when no parse/audio work remains.
