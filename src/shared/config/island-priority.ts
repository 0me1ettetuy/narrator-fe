// Default placement of island items: higher lands higher. Only decides where an
// item first appears; the user can then drag draggable items.
export const ISLAND_PRIORITY = {
  changes: 30,
  player: 20,
  generation: 10,
} as const;
