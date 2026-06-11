// Per-project scratchpad state, persisted in the browser's localStorage so it
// always reopens exactly where you left off. (Local to this browser for now; a
// "save to vault" action can file it as a real note later.)

export interface ScratchState {
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULTS: ScratchState = { content: "", x: 1180, y: 96, w: 360, h: 320 };
const key = (slug: string) => `cockpit.scratch.${slug}`;

export function loadScratch(slug: string): ScratchState {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw) {
      const p = JSON.parse(raw) as Partial<ScratchState>;
      return {
        content: typeof p.content === "string" ? p.content : "",
        x: typeof p.x === "number" ? p.x : DEFAULTS.x,
        y: typeof p.y === "number" ? p.y : DEFAULTS.y,
        w: typeof p.w === "number" ? p.w : DEFAULTS.w,
        h: typeof p.h === "number" ? p.h : DEFAULTS.h,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function saveScratch(slug: string, s: ScratchState): void {
  try {
    localStorage.setItem(key(slug), JSON.stringify(s));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
