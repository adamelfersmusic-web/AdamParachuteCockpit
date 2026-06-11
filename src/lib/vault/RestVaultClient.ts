import type { VaultNote } from "../model/types";
import { ConflictError, type CreateNoteInput, type UpdateNotePatch, type VaultClient } from "./VaultClient";
import { ApiError, VaultApi } from "./parachute/api";
import type { Note } from "./parachute/types";

// The live adapter: implements the Cockpit's VaultClient on top of Adam Deck's
// VaultApi (OAuth → the Parachute REST API). The factory wraps this in the Deck
// firewall + dry-run guard, so the rest of the app is unchanged from the mock.

function toVaultNote(n: Note): VaultNote {
  return {
    id: n.id,
    path: n.path,
    content: n.content ?? "",
    tags: n.tags ?? [],
    metadata: (n.metadata ?? {}) as Record<string, any>,
    createdAt: n.createdAt ?? "",
    updatedAt: n.updatedAt ?? "",
  };
}

export class RestVaultClient implements VaultClient {
  constructor(private readonly api: VaultApi) {}

  async listProjects(): Promise<VaultNote[]> {
    const notes = await this.api.queryNotes({ tag: "project", includeContent: true, limit: 200 });
    return notes.map(toVaultNote);
  }

  async getBlocks(projectSlug: string): Promise<VaultNote[]> {
    const notes = await this.api.queryNotes({
      tag: `project/${projectSlug}`,
      includeContent: true,
      limit: 500,
    });
    return notes.map(toVaultNote);
  }

  async getNote(id: string): Promise<VaultNote> {
    return toVaultNote(await this.api.getNote(id));
  }

  async createNote(input: CreateNoteInput): Promise<VaultNote> {
    const note = await this.api.createNote({
      path: input.path,
      content: input.content,
      tags: input.tags ?? [],
      metadata: input.metadata,
    });
    return toVaultNote(note);
  }

  async updateNote(id: string, patch: UpdateNotePatch, ifUpdatedAt?: string): Promise<VaultNote> {
    // Our interface expresses tag changes as add/remove; the REST contract is a
    // full replace — resolve to a full set only when tags actually change.
    let tags: string[] | undefined;
    if (patch.tags && (patch.tags.add?.length || patch.tags.remove?.length)) {
      const current = await this.api.getNote(id);
      const set = new Set(current.tags ?? []);
      for (const t of patch.tags.add ?? []) set.add(t);
      for (const t of patch.tags.remove ?? []) set.delete(t);
      tags = [...set];
    }
    try {
      const note = await this.api.updateNote(id, {
        content: patch.content,
        metadata: patch.metadata,
        tags,
        ifUpdatedAt,
      });
      return toVaultNote(note);
    } catch (e) {
      if (e instanceof ApiError && e.conflict) {
        const latest = await this.api
          .getNote(id)
          .then(toVaultNote)
          .catch(() => null);
        if (latest) throw new ConflictError(latest);
      }
      throw e;
    }
  }

  async compressScratchpad(text: string, _maxWords = 200): Promise<string> {
    // Slice 4: route to Claude (the vault has no summarize endpoint). For now the
    // raw text is written back as-is.
    return text.trim();
  }
}
