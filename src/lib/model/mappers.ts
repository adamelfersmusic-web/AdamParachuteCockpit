import type {
  Block,
  BlockType,
  CockpitBlockMeta,
  CockpitProjectMeta,
  Project,
  Subtask,
  VaultNote,
} from "./types";

// ---------------------------------------------------------------------------
// Pure functions that turn raw VaultNotes into the view models the UI renders.
// Kept dependency-free so they're trivial to unit-test and reuse server-side.
// ---------------------------------------------------------------------------

const SLUG_SUFFIX = /-[a-z0-9]{4,5}$/; // strips Parachute's random path suffix

/** Stable project key. Prefers an explicit metadata slug, else derives from path. */
export function slugOf(note: VaultNote): string {
  const explicit = (note.metadata?.cockpit as CockpitProjectMeta | undefined)?.slug;
  if (explicit) return explicit;
  const tail = note.path.replace(/^projects\//i, "");
  return tail.replace(SLUG_SUFFIX, "");
}

/** First "# Heading" line, else first non-empty line, else the path. */
export function titleOf(content: string, fallback = "Untitled"): string {
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const h = line.match(/^#{1,3}\s+(.*)$/);
    return h ? h[1].trim() : line;
  }
  return fallback;
}

/** Content with its leading title line removed, for previews/paper body. */
export function stripTitle(content: string): string {
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i < lines.length && /^#{1,3}\s+/.test(lines[i].trim())) i++;
  return lines.slice(i).join("\n").replace(/^\n+/, "");
}

export function blockTypeOf(tags: string[]): BlockType {
  if (tags.includes("todo")) return "todo";
  if (tags.includes("scratchpad") || tags.includes("sketchpad")) return "scratchpad";
  if (tags.includes("text")) return "text";
  return "note";
}

const SUBTASK_RE = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/;

export function parseSubtasks(content: string): Subtask[] {
  const out: Subtask[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(SUBTASK_RE);
    if (m) out.push({ done: m[1].toLowerCase() === "x", text: m[2].trim() });
  }
  return out;
}

export function buildBlock(note: VaultNote): Block {
  const c = (note.metadata?.cockpit ?? {}) as CockpitBlockMeta;
  const type = blockTypeOf(note.tags);
  return {
    id: note.id,
    note,
    type,
    title: titleOf(note.content, type === "scratchpad" ? "Scratchpad" : "Untitled"),
    body: stripTitle(note.content),
    subtasks: type === "todo" ? parseSubtasks(note.content) : [],
    x: c.x ?? 80,
    y: c.y ?? 80,
    w: c.w ?? 320,
    h: c.h ?? 200,
    z: c.z ?? 1,
    collapsed: false,
  };
}

export function buildProject(note: VaultNote, blocks: Block[]): Project {
  const c = (note.metadata?.cockpit ?? {}) as CockpitProjectMeta;
  const openTaskCount = blocks
    .filter((b) => b.type === "todo")
    .reduce((sum, b) => sum + b.subtasks.filter((s) => !s.done).length, 0);
  return {
    note,
    slug: slugOf(note),
    title: titleOf(note.content),
    phase: c.phase ?? "",
    domains: c.domains ?? [],
    order: c.order ?? Number.MAX_SAFE_INTEGER,
    deepNoteId: note.metadata?.deep,
    openTaskCount,
  };
}
