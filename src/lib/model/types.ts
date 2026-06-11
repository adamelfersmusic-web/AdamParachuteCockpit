// ---------------------------------------------------------------------------
// Core types. A VaultNote mirrors exactly what Parachute returns (MCP today,
// REST tonight) so the transport stays a swappable detail. Everything the UI
// renders is derived from VaultNote via the mappers — never invented.
// ---------------------------------------------------------------------------

export type BlockType = "note" | "todo" | "scratchpad" | "text";

/** Per-block canvas placement, stored on the block note's own metadata.cockpit. */
export interface CockpitBlockMeta {
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  /** Stable association key, mirrors the project's slug. */
  slug?: string;
}

/** Per-project tile metadata, stored on the project note's metadata.cockpit. */
export interface CockpitProjectMeta {
  slug?: string;
  phase?: string;
  order?: number;
  domains?: string[];
}

/** The raw note shape — 1:1 with the Parachute note record. */
export interface VaultNote {
  id: string;
  path: string;
  content: string;
  tags: string[];
  // Loose on purpose: metadata is free-form JSON, merged key-by-key on write.
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// --- View models (derived; what components actually consume) ----------------

export interface Subtask {
  done: boolean;
  text: string;
}

export interface Project {
  note: VaultNote;
  slug: string;
  title: string;
  phase: string;
  domains: string[];
  order: number;
  deepNoteId?: string;
  /** Unchecked subtasks across this project's todo blocks. */
  openTaskCount: number;
}

export interface Block {
  id: string;
  note: VaultNote;
  type: BlockType;
  title: string;
  /** Content with the leading "# Title" line stripped, for previews. */
  body: string;
  subtasks: Subtask[];
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  collapsed: boolean;
}
