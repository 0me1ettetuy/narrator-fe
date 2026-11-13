# Narrator frontend documentation

Routing table and rules for this docs tree. Read this file instead of opening
documents to find out what they hold. `AGENTS.md` (loaded through `CLAUDE.md`)
links here and nothing else needs to be read first.

## Rules

**Where a fact goes**

| The fact is…                                     | It goes in…                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| A frontend behavior that must be preserved       | `features/product-behavior.md`                          |
| A product capability or limit                    | the backend `features/` docs (one place for both repos) |
| How the frontend is structured or delivered      | `architecture/`                                         |
| A change that was just made                      | `history.md`, "Recent changes", 1–3 lines               |
| Known follow-up, or a hidden or disabled feature | `issues/`                                               |
| A plan                                           | `superpowers/` or the domain's plan doc                 |

**Editing.** Find the owning doc in the table, edit that doc, and keep it
accurate rather than appending a changelog to it. Fix every link to anything
you rename or remove.

**Creating a doc.** Prefer, in order: edit an existing doc, add a section to
one, create a new file. A new file goes in the folder of the domain it
describes, starts with a `# Title`, a one-sentence summary and a `Status:`
line (`current`, `historical`, `superseded`, `deferred`), and is linked from
that folder's README and, for a new top-level domain, from the table below.
Name files after what they hold, in lowercase-kebab-case. Never leave a doc
unlinked.

**Size budget.** An index README stays under about 100 lines. Any other doc
stays under about 300 lines, with a hard cap of 400. Docs over 100 lines start
with a short contents list. A doc you touch that is over budget is split
before the task is done: turn it into a folder whose README is a routing table
(one row per part: what it holds, when to edit it), and keep parts above about
100 lines so the tree does not fragment.

**Status tags.** `current` is safe to rely on. `historical`, `superseded` and
`deferred` docs are context only; never use them to learn current behavior.
Historical docs are exempt from the size budget unless you edit them.

## Features that hold state across actions

The app-wide audio player keeps per-book state (chapter, position, speed) in
localStorage and a queue derived from the book's chapters with ready audio
([plan](superpowers/plans/2026-11-13-island-player.md)). Any change that can
alter that state must account for it and ship its own solution in the same
change: audio regenerate or delete, chapter tag or narration changes, merge,
reorder, restore or remove chapter, book delete or visibility change, voice or
model change, logout. For each one, decide what the player does (keep playing,
skip, reset to 0:00, close, clear saved state), write it in
`features/product-behavior.md`, and check the plan's Review Focus list.

## Routing table

| Area                                                          | Open it for                                                                                                              | Edit it when                                                                       | Status     |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------- |
| [features/](features/README.md)                               | `product-behavior.md`: behaviors to preserve; pointer to the backend feature docs                                        | UI behavior on the book page, Models page, library, sharing or collections changes | current    |
| [history.md](history.md)                                      | recent milestones; older ones in `history/milestones-archive.md`, every commit in `history/commit-index.md`              | every change (recent changes)                                                      | log        |
| [architecture/](architecture/README.md)                       | FSD placement, routing, API and forms, delivery checklist, container deployment, UI primitive sizes (`ui-primitives.md`) | structure, conventions, Docker delivery or a primitive's size changes              | current    |
| [books/](books/README.md)                                     | chapter-curation interaction and cache design, cover viewing                                                             | curation or cover UI changes                                                       | current    |
| [issues/](issues/README.md)                                   | deferred work; hidden or disabled UI (curation, role tags, local TTS) and how to restore it                              | an issue is opened, resolved or moved into its domain doc                          | deferred   |
| [superpowers/](superpowers/README.md)                         | dated implementation plans (book collections)                                                                            | a new plan is written                                                              | historical |
| [Docs system](../../narrator-general-api/docs/docs-system.md) | how this docs tree works (maintained once, in the backend repo)                                                          | the docs rules or layout change                                                    | current    |
| [../README.md](../README.md)                                  | project overview and setup                                                                                               | setup steps change                                                                 | current    |

## Cross-repository

Product features and backend rules live in
`../../narrator-general-api/docs/README.md`.
