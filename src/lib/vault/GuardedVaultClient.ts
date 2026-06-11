import type { VaultNote } from "../model/types";
import type { CreateNoteInput, UpdateNotePatch, VaultClient } from "./VaultClient";
import {
  assertNoDeckMetadata,
  assertNoDeckTags,
  isDeckTag,
  ReadOnlyError,
  VaultGuardError,
} from "./guard";

/**
 * Wraps any VaultClient and enforces the Deck firewall on every write. Reads
 * pass through (reading can't damage anything, and the Cockpit only ever queries
 * its own `project` / `project/<slug>` tags anyway). The factory wraps both the
 * mock and the future REST client in this, so a frontend bug can never reach
 * Adam's Deck data.
 */
export class GuardedVaultClient implements VaultClient {
  constructor(
    private readonly inner: VaultClient,
    private readonly opts: { readOnly?: boolean } = {},
  ) {}

  listProjects(): Promise<VaultNote[]> {
    return this.inner.listProjects();
  }

  getNote(id: string): Promise<VaultNote> {
    return this.inner.getNote(id);
  }

  compressScratchpad(text: string, maxWords?: number): Promise<string> {
    return this.inner.compressScratchpad(text, maxWords);
  }

  async getBlocks(projectSlug: string): Promise<VaultNote[]> {
    if (isDeckTag(projectSlug)) {
      throw new VaultGuardError(`getBlocks: refusing Deck slug "${projectSlug}"`);
    }
    return this.inner.getBlocks(projectSlug);
  }

  async createNote(input: CreateNoteInput): Promise<VaultNote> {
    if (this.opts.readOnly) throw new ReadOnlyError("createNote");
    assertNoDeckTags(input.tags, "createNote");
    assertNoDeckMetadata(input.metadata, "createNote");
    return this.inner.createNote(input);
  }

  async updateNote(
    id: string,
    patch: UpdateNotePatch,
    ifUpdatedAt?: string,
  ): Promise<VaultNote> {
    if (this.opts.readOnly) throw new ReadOnlyError(`updateNote(${id})`);
    // Ironclad rule: never write a note that itself carries a Deck tag,
    // regardless of what the patch contains.
    const existing = await this.inner.getNote(id);
    assertNoDeckTags(existing.tags, `updateNote(${id})`);
    assertNoDeckTags(patch.tags?.add, "updateNote");
    assertNoDeckMetadata(patch.metadata, "updateNote");
    return this.inner.updateNote(id, patch, ifUpdatedAt);
  }
}
