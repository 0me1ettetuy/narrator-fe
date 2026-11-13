# Library cover play button

Status: deferred.

## Issue

The audio player ships with a Play button on the book page only. Library and
home book covers (`BookCoverTile`) have no Play button.

## Why it is not done

- The book list data does not say whether a book has ready audio, so a cover
  button can only discover that after the click (toast `player.noAudio`).
- `BookCoverTile` is a single link; a button cannot sit inside it. It would
  need a wrapper and a slot prop (an entity may not import the player feature).
- It must be visible without hover so touch devices can use it.

## Intended behavior

Same as the book page button: `playBook(bookId)` resumes the saved chapter and
position, or starts at the first chapter with audio. See the
[island player plan](../superpowers/plans/2026-11-13-island-player.md).
