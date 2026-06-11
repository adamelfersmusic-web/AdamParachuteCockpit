// Per-project canvas layout overrides, persisted in localStorage: which blocks
// are collapsed and where you've dragged them. This is your "work screen" — it
// survives reloads even for derived blocks (which have no vault home of their
// own). Content still comes from the vault; this is just the arrangement.

export interface BlockLayout {
  collapsed?: boolean;
  x?: number;
  y?: number;
}
export type ProjectLayout = Record<string, BlockLayout>;

const key = (slug: string) => `cockpit.layout.${slug}`;

export function loadLayout(slug: string): ProjectLayout {
  try {
    const raw = localStorage.getItem(key(slug));
    if (raw) return JSON.parse(raw) as ProjectLayout;
  } catch {
    /* ignore */
  }
  return {};
}

export function saveLayout(slug: string, layout: ProjectLayout): void {
  try {
    localStorage.setItem(key(slug), JSON.stringify(layout));
  } catch {
    /* ignore quota / private mode */
  }
}

export function patchLayout(slug: string, id: string, patch: BlockLayout): void {
  const layout = loadLayout(slug);
  layout[id] = { ...layout[id], ...patch };
  saveLayout(slug, layout);
}
