import { describe, expect, it } from "vitest";
import type { VaultNote } from "../model/types";
import { GuardedVaultClient } from "./GuardedVaultClient";
import { MockVaultClient } from "./MockVaultClient";
import { ReadOnlyError, VaultGuardError } from "./guard";

// A note that belongs to Adam's Deck — exactly the shape the real vault holds.
const deckNote: VaultNote = {
  id: "deck-1",
  path: "deck/dawn-song",
  content: "# Dawn song draft",
  tags: ["deck"],
  metadata: { horizon: "today", done: false, order: 1781077344611, tier: "move", now: true },
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-10T00:00:00.000Z",
};

function guarded() {
  return new GuardedVaultClient(new MockVaultClient([structuredClone(deckNote)]));
}

describe("Deck firewall", () => {
  it("refuses to update a note that carries a deck tag", async () => {
    await expect(guarded().updateNote("deck-1", { content: "changed" })).rejects.toBeInstanceOf(
      VaultGuardError,
    );
  });

  it("refuses to create a note with a deck/* tag", async () => {
    await expect(
      guarded().createNote({ content: "x", tags: ["deck/today"] }),
    ).rejects.toBeInstanceOf(VaultGuardError);
  });

  it("refuses to write a Deck-owned metadata key", async () => {
    await expect(
      guarded().createNote({ content: "x", tags: ["note"], metadata: { horizon: "today" } }),
    ).rejects.toBeInstanceOf(VaultGuardError);
  });

  it("refuses to query the deck namespace via getBlocks", async () => {
    await expect(guarded().getBlocks("deck")).rejects.toBeInstanceOf(VaultGuardError);
  });

  it("allows a normal Cockpit write (project block with nested cockpit metadata)", async () => {
    const note = await guarded().createNote({
      content: "# A block",
      tags: ["note", "project/parachute"],
      metadata: { cockpit: { x: 0, y: 0, w: 320, h: 200 } },
    });
    expect(note.id).toBeTruthy();
    expect(note.tags).toContain("project/parachute");
  });
});

describe("Dry-run (read-only) mode", () => {
  const readOnly = () =>
    new GuardedVaultClient(new MockVaultClient([structuredClone(deckNote)]), { readOnly: true });

  it("blocks createNote", async () => {
    await expect(
      readOnly().createNote({ content: "x", tags: ["note"] }),
    ).rejects.toBeInstanceOf(ReadOnlyError);
  });

  it("blocks updateNote (before it even reads the note)", async () => {
    await expect(readOnly().updateNote("any-id", { content: "x" })).rejects.toBeInstanceOf(
      ReadOnlyError,
    );
  });

  it("still allows reads", async () => {
    await expect(readOnly().getNote("deck-1")).resolves.toBeTruthy();
  });
});
