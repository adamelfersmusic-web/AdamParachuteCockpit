import type { VaultNote } from "../model/types";

// ---------------------------------------------------------------------------
// The seam. Every screen talks to this interface and nothing else — so the
// transport (in-memory mock today, Parachute REST via a BFF tonight) is a
// single swappable implementation. These methods mirror the Parachute tool
// surface (query-notes / create-note / update-note) so the REST adapter is a
// thin mapping, not a rewrite.
// ---------------------------------------------------------------------------

export interface CreateNoteInput {
  path?: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, any>;
  links?: { target: string; relationship: string }[];
}

export interface UpdateNotePatch {
  content?: string;
  /** Merged key-by-key into existing metadata, matching Parachute semantics. */
  metadata?: Record<string, any>;
  tags?: { add?: string[]; remove?: string[] };
}

/** Thrown when an optimistic-concurrency precondition (if_updated_at) fails. */
export class ConflictError extends Error {
  constructor(public readonly latest: VaultNote) {
    super("Note changed since it was last read");
    this.name = "ConflictError";
  }
}

export interface VaultClient {
  /** All notes tagged `project`. */
  listProjects(): Promise<VaultNote[]>;
  /** All block notes for a project — tagged `project/<slug>`. */
  getBlocks(projectSlug: string): Promise<VaultNote[]>;
  /** A single note by id (fresh read; capture updatedAt for write-back). */
  getNote(id: string): Promise<VaultNote>;
  createNote(input: CreateNoteInput): Promise<VaultNote>;
  /** Pass ifUpdatedAt to guard against clobbering a concurrent edit. */
  updateNote(
    id: string,
    patch: UpdateNotePatch,
    ifUpdatedAt?: string,
  ): Promise<VaultNote>;
  /** Scratchpad → tidy note. Mock truncates; the live adapter routes to Claude. */
  compressScratchpad(text: string, maxWords?: number): Promise<string>;
}
