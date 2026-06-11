// Dot-grid geometry. The grid is the visual unit and the snap unit.
export const GRID = 24;

export const snap = (v: number) => Math.round(v / GRID) * GRID;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
