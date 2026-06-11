import type { VaultNote } from "./types";
import type { VaultClient } from "../vault";

// When a project's canvas has no explicitly-placed blocks yet (the common case
// on a freshly-connected live vault), derive a starter board from the project's
// real content: the project "wall" note, plus its linked deep note split into
// one block per `##` section. Read-only — nothing is written back to the vault.

interface Section {
  content: string;
  hasTodos: boolean;
}

const TODO_RE = /^\s*[-*]\s+\[[ xX]\]\s+/m;

export function splitSections(noteContent: string): Section[] {
  const lines = noteContent.split("\n");
  const sections: Section[] = [];
  let cur: string[] | null = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (cur) sections.push(toSection(cur));
      cur = [line];
    } else if (cur) {
      cur.push(line);
    }
    // lines before the first `##` (the note's title + tagline) are dropped
  }
  if (cur) sections.push(toSection(cur));
  if (sections.length === 0) {
    const content = noteContent.trim();
    return content ? [{ content, hasTodos: TODO_RE.test(content) }] : [];
  }
  return sections;
}

function toSection(lines: string[]): Section {
  const content = lines.join("\n").trim();
  return { content, hasTodos: TODO_RE.test(content) };
}

const W = 330;
const H = 240;
const COLS = 3;
const X0 = 80;
const Y0 = 96;
const GAP = 24;

function place(i: number) {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { x: X0 + col * (W + GAP), y: Y0 + row * (H + GAP), w: W, h: H, z: 1 };
}

export async function deriveProjectBlocks(
  client: VaultClient,
  projectNote: VaultNote,
): Promise<VaultNote[]> {
  const out: VaultNote[] = [];

  // The project "wall" note (where it's at / next steps) as the anchor block.
  out.push({
    ...projectNote,
    id: `${projectNote.id}#wall`,
    tags: ["note"],
    metadata: { cockpit: place(0) },
  });

  const deepId = (projectNote.metadata as any)?.deep;
  if (typeof deepId === "string" && deepId) {
    try {
      const deep = await client.getNote(deepId);
      for (const sec of splitSections(deep.content)) {
        out.push({
          id: `${deep.id}#${out.length}`,
          path: deep.path,
          content: sec.content,
          tags: [sec.hasTodos ? "todo" : "note"],
          metadata: { cockpit: place(out.length) },
          createdAt: deep.createdAt,
          updatedAt: deep.updatedAt,
        });
      }
    } catch {
      /* deep note unreadable — the wall block alone is a fine fallback */
    }
  }
  return out;
}
