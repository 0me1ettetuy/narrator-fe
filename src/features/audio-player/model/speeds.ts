export const SPEEDS = [1, 1.25, 1.5, 2, 0.75] as const;

export function nextSpeed(speed: number): number {
  const index = SPEEDS.findIndex((item) => item === speed);

  return index === -1 ? 1 : SPEEDS[(index + 1) % SPEEDS.length];
}
