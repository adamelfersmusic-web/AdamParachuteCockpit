// ---------------------------------------------------------------------------
// THE DECK FIREWALL.
//
// Adam's Deck (a separate Parachute UI — an ADHD personal operating system) is
// the sibling app on this same vault. It owns the `deck` tag family and a set of
// top-level metadata keys. The Cockpit must NEVER:
//   - read/write/tag a note in the deck/* namespace,
//   - add a deck tag to any note,
//   - write any of Deck's top-level metadata keys.
//
// Enforced here, in the vault layer, so it holds for EVERY transport — the mock
// today and the live REST adapter tonight. By construction, not by convention.
// ---------------------------------------------------------------------------

export const DECK_TAG = "deck";

/** Top-level metadata keys owned by Adam's Deck. The Cockpit never writes these. */
export const DECK_METADATA_KEYS = ["horizon", "done", "tier", "now", "order"] as const;

export function isDeckTag(tag: string): boolean {
  return tag === DECK_TAG || tag.startsWith(DECK_TAG + "/");
}

export class VaultGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaultGuardError";
  }
}

/**
 * Thrown when the Cockpit is in dry-run (read-only) mode and a write is attempted.
 * Lets us connect to the live vault with a normal write token but keep every
 * write blocked until we've verified reads — a substitute for a read-only token.
 */
export class ReadOnlyError extends Error {
  constructor(op: string) {
    super(`Cockpit is in read-only (dry-run) mode — blocked write: ${op}`);
    this.name = "ReadOnlyError";
  }
}

export function assertNoDeckTags(tags: string[] | undefined, ctx: string): void {
  for (const t of tags ?? []) {
    if (isDeckTag(t)) {
      throw new VaultGuardError(`${ctx}: refusing to touch Adam's Deck tag "${t}"`);
    }
  }
}

export function assertNoDeckMetadata(meta: Record<string, any> | undefined, ctx: string): void {
  if (!meta) return;
  for (const k of DECK_METADATA_KEYS) {
    if (k in meta) {
      throw new VaultGuardError(`${ctx}: refusing to write Deck-owned metadata key "${k}"`);
    }
  }
}
