import { describe, expect, it } from "vitest";
import type { VaultNote } from "./types";
import type { VaultClient } from "../vault";
import { deriveProjectBlocks, splitSections } from "./derive";

const SAMPLE_DEEP = `# Project X — Cockpit
*the whole map*

## Objective
Do the thing.

## Tasks
- [ ] one
- [ ] two

## Notes
Some prose here.
`;

describe("splitSections", () => {
  it("splits a note into one section per ## heading", () => {
    const secs = splitSections(SAMPLE_DEEP);
    expect(secs.length).toBe(3);
  });

  it("flags sections that contain checkbox todos", () => {
    const secs = splitSections(SAMPLE_DEEP);
    expect(secs[1].hasTodos).toBe(true); // Tasks
    expect(secs[0].hasTodos).toBe(false); // Objective
  });

  it("treats a note with no ## sections as a single block", () => {
    const secs = splitSections("# Title\n\nJust prose, no sections.");
    expect(secs.length).toBe(1);
  });
});

describe("deriveProjectBlocks", () => {
  const projectNote: VaultNote = {
    id: "proj-1",
    path: "projects/x",
    content: "# Project X\n## Where it's at\nKickoff.",
    tags: ["project"],
    metadata: { deep: "deep-1" },
    createdAt: "",
    updatedAt: "",
  };

  const client = {
    getNote: async (id: string): Promise<VaultNote> => ({
      id,
      path: "Project X — Status",
      content: SAMPLE_DEEP,
      tags: [],
      metadata: {},
      createdAt: "",
      updatedAt: "",
    }),
  } as unknown as VaultClient;

  it("produces the wall block plus one block per deep-note section", async () => {
    const blocks = await deriveProjectBlocks(client, projectNote);
    // 1 wall + 3 sections
    expect(blocks.length).toBe(4);
    expect(blocks[0].id).toBe("proj-1#wall");
    // the Tasks section became a todo-tagged block
    expect(blocks.some((b) => b.tags.includes("todo"))).toBe(true);
    // every block has a canvas position
    expect(blocks.every((b) => typeof b.metadata.cockpit?.x === "number")).toBe(true);
  });

  it("still returns the wall block when the deep note can't be read", async () => {
    const failing = {
      getNote: async () => {
        throw new Error("404");
      },
    } as unknown as VaultClient;
    const blocks = await deriveProjectBlocks(failing, projectNote);
    expect(blocks.length).toBe(1);
    expect(blocks[0].id).toBe("proj-1#wall");
  });
});
