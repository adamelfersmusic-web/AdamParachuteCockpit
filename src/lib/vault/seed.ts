import type { VaultNote } from "../model/types";

// ---------------------------------------------------------------------------
// DEMO SEED — generic, fictional placeholder data for the no-vault "Explore the
// demo" mode. Deliberately contains NO real vault content, so this file is safe
// to publish in a public repo. The live app never uses this seed: connected via
// OAuth, every block is a real note loaded from your vault at runtime.
// ---------------------------------------------------------------------------

function note(
  n: Partial<VaultNote> & { id: string; content: string; tags: string[] },
): VaultNote {
  return {
    path: n.path ?? n.id,
    metadata: n.metadata ?? {},
    createdAt: n.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: n.updatedAt ?? "2026-01-01T00:00:00.000Z",
    ...n,
  };
}

// === PROJECT 1 — Lighthouse Rebrand =======================================

const p1Wall = note({
  id: "demo-p1",
  path: "projects/lighthouse-rebrand",
  tags: ["project"],
  metadata: { deep: "demo-p1-deep", cockpit: { slug: "lighthouse-rebrand", phase: "Discovery", order: 1, domains: ["brand", "client"] } },
  content: `# Lighthouse Rebrand

## Where it's at
Kickoff done. Running the brand audit and pulling references before the first
direction review.

## Next steps
- Finish the brand audit
- Build the moodboard
- Draft three directions for review
`,
});

const p1Deep = note({
  id: "demo-p1-deep",
  path: "Lighthouse — Status",
  tags: ["note", "project/lighthouse-rebrand", "status"],
  metadata: { cockpit: { slug: "lighthouse-rebrand", x: 80, y: 96, w: 420, h: 300, z: 1 } },
  content: `# Lighthouse Rebrand — Project Cockpit
*Deep note · the whole map, visited on purpose.*

## Objective
Refresh the identity without losing what people already recognize.

## Scope
- Brand audit + competitive scan
- New logo system + type + color
- One-page brand guide
`,
});

const p1Todo1 = note({
  id: "demo-p1-todo1",
  path: "lighthouse/brand-audit",
  tags: ["todo", "project/lighthouse-rebrand"],
  metadata: { cockpit: { slug: "lighthouse-rebrand", x: 540, y: 96, w: 320, h: 220, z: 1 } },
  content: `# Brand audit
- [ ] Inventory current assets
- [ ] Competitive scan (5 brands)
- [ ] Pull reference moodboard
- [ ] Write the one-page findings
`,
});

const p1Text = note({
  id: "demo-p1-text",
  path: "lighthouse/note",
  tags: ["text", "project/lighthouse-rebrand"],
  metadata: { cockpit: { slug: "lighthouse-rebrand", x: 80, y: 430, w: 380, h: 110, z: 1 } },
  content: `# North star
Keep the mark recognizable; modernize everything around it.
`,
});

// === PROJECT 2 — Q3 Product Launch ========================================

const p2Wall = note({
  id: "demo-p2",
  path: "projects/q3-launch",
  tags: ["project"],
  metadata: { deep: "demo-p2-deep", cockpit: { slug: "q3-launch", phase: "Phase 2", order: 2, domains: ["marketing", "product"] } },
  content: `# Q3 Product Launch

**Phase 2**
- Lock the launch date
- Finish the landing page
- Line up the email sequence
- Brief the channels
`,
});

const p2Deep = note({
  id: "demo-p2-deep",
  path: "Q3 — Status",
  tags: ["note", "project/q3-launch", "status"],
  metadata: { cockpit: { slug: "q3-launch", x: 80, y: 96, w: 420, h: 280, z: 1 } },
  content: `# Q3 Launch — Project Cockpit

## Goal
Ship the new release with a clean launch moment and a measurable bump.

## Workstreams
- Landing page + copy
- Email sequence (3 sends)
- Social + partner channels
`,
});

const p2Todo1 = note({
  id: "demo-p2-todo1",
  path: "q3/launch-checklist",
  tags: ["todo", "project/q3-launch"],
  metadata: { cockpit: { slug: "q3-launch", x: 540, y: 96, w: 320, h: 240, z: 1 } },
  content: `# Launch checklist
- [ ] Lock the date
- [ ] Landing page live
- [ ] Email sequence written
- [ ] Channels briefed
- [ ] Analytics in place
`,
});

const p2Text = note({
  id: "demo-p2-text",
  path: "q3/goal",
  tags: ["text", "project/q3-launch"],
  metadata: { cockpit: { slug: "q3-launch", x: 80, y: 404, w: 380, h: 110, z: 1 } },
  content: `# Target
A clean launch moment + a measurable lift in signups.
`,
});

// === PROJECT 3 — Studio Album =============================================

const p3Wall = note({
  id: "demo-p3",
  path: "projects/studio-album",
  tags: ["project"],
  metadata: { deep: "demo-p3-deep", cockpit: { slug: "studio-album", phase: "Mixing", order: 3, domains: ["music", "personal"] } },
  content: `# Studio Album

## Where it's at
Tracking done. Into mixing — then masters and artwork.

## Next steps
- Comp the vocals
- Rough mixes for all songs
- Send for mastering
`,
});

const p3Deep = note({
  id: "demo-p3-deep",
  path: "Album — Status",
  tags: ["note", "project/studio-album", "status"],
  metadata: { cockpit: { slug: "studio-album", x: 80, y: 96, w: 400, h: 250, z: 1 } },
  content: `# Studio Album — Project Cockpit

## Where it's at
Ten songs tracked. Mixing in progress; masters + artwork to follow.
`,
});

const p3Todo1 = note({
  id: "demo-p3-todo1",
  path: "album/tracklist",
  tags: ["todo", "project/studio-album"],
  metadata: { cockpit: { slug: "studio-album", x: 520, y: 96, w: 320, h: 220, z: 1 } },
  content: `# To finish
- [ ] Comp the vocals
- [ ] Rough mix all songs
- [ ] Pick the single
- [ ] Send for mastering
`,
});

const p3Scratch = note({
  id: "demo-p3-scratch",
  path: "album/scratchpad",
  tags: ["scratchpad", "project/studio-album"],
  metadata: { cockpit: { slug: "studio-album", x: 520, y: 360, w: 320, h: 150, z: 1 } },
  content: `Idea: open the record with the quiet take, save the big one for track 3.`,
});

export function seedNotes(): VaultNote[] {
  return JSON.parse(
    JSON.stringify([
      p1Wall, p1Deep, p1Todo1, p1Text,
      p2Wall, p2Deep, p2Todo1, p2Text,
      p3Wall, p3Deep, p3Todo1, p3Scratch,
    ]),
  );
}
