import type { VaultNote } from "../model/types";
import {
  ConflictError,
  type CreateNoteInput,
  type UpdateNotePatch,
  type VaultClient,
} from "./VaultClient";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * In-memory VaultClient seeded from real vault data. Behaves like Parachute:
 * metadata merges key-by-key, writes bump updatedAt, and optimistic-concurrency
 * preconditions are enforced. Tonight this is replaced by a RestVaultClient that
 * hits the BFF — the rest of the app doesn't change.
 */
export class MockVaultClient implements VaultClient {
  private notes = new Map<string, VaultNote>();
  private seq = 0;

  constructor(seed: VaultNote[]) {
    for (const n of seed) this.notes.set(n.id, n);
  }

  async listProjects(): Promise<VaultNote[]> {
    await wait(80);
    return [...this.notes.values()].filter((n) => n.tags.includes("project")).map(clone);
  }

  async getBlocks(projectSlug: string): Promise<VaultNote[]> {
    await wait(80);
    const tag = `project/${projectSlug}`;
    return [...this.notes.values()].filter((n) => n.tags.includes(tag)).map(clone);
  }

  async getNote(id: string): Promise<VaultNote> {
    await wait(40);
    const n = this.notes.get(id);
    if (!n) throw new Error(`Note not found: ${id}`);
    return clone(n);
  }

  async createNote(input: CreateNoteInput): Promise<VaultNote> {
    await wait(80);
    const now = new Date().toISOString();
    const id = `mock-${now.replace(/[^0-9]/g, "")}-${this.seq++}`;
    const created: VaultNote = {
      id,
      path: input.path ?? id,
      content: input.content,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(id, created);
    return clone(created);
  }

  async updateNote(
    id: string,
    patch: UpdateNotePatch,
    ifUpdatedAt?: string,
  ): Promise<VaultNote> {
    await wait(60);
    const current = this.notes.get(id);
    if (!current) throw new Error(`Note not found: ${id}`);
    if (ifUpdatedAt && ifUpdatedAt !== current.updatedAt) {
      throw new ConflictError(clone(current));
    }
    if (patch.content !== undefined) current.content = patch.content;
    if (patch.metadata) current.metadata = { ...current.metadata, ...patch.metadata };
    if (patch.tags?.add) current.tags = [...new Set([...current.tags, ...patch.tags.add])];
    if (patch.tags?.remove) {
      const drop = new Set(patch.tags.remove);
      current.tags = current.tags.filter((t) => !drop.has(t));
    }
    current.updatedAt = new Date().toISOString();
    return clone(current);
  }

  async compressScratchpad(text: string, maxWords = 200): Promise<string> {
    await wait(150);
    // Mock stand-in. The live adapter routes this to Claude via the BFF.
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text.trim();
    return words.slice(0, maxWords).join(" ") + " …";
  }
}
