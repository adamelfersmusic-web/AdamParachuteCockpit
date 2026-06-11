# The Cockpit

A spatial project cockpit layered on the **Adam Parachute vault**. Net-new app —
**separate from Adam's Deck** (the `deck/*` tag family). The Cockpit never reads
or writes `deck` notes.

> Status: **Slices 0–2** — Foundation + Home + read-only Canvas, running against an
> in-memory mock **seeded from real vault data**. No live writes yet.

## Not touching Adam's Deck (the Deck firewall)

The Cockpit and Adam's Deck are sibling Parachute UIs on the **same vault**, so the
only real risk is vault data, not code. Adam's Deck owns the **`deck` tag family**
and the top-level metadata keys **`horizon`, `done`, `tier`, `now`, `order`**.

[`guard.ts`](src/lib/vault/guard.ts) + [`GuardedVaultClient`](src/lib/vault/GuardedVaultClient.ts)
enforce, for **every** transport (mock today, REST tonight):

- never write a note that carries a `deck`/`deck/*` tag,
- never add a deck tag to any note,
- never write a Deck-owned metadata key (the Cockpit nests everything under `cockpit`),
- never query the deck namespace.

The factory wraps the inner client in this firewall, so even a frontend bug can't
reach Deck. Proven by [`guard.test.ts`](src/lib/vault/guard.test.ts) — `npm test`.

## Run it

```bash
cd cockpit
npm install
npm run dev      # http://localhost:5173
```

`npm run build` typechecks + bundles. `npm run typecheck` is types-only.

## What works now

- **Home** — project tiles for your real Jonathan / Amanda / Parachute projects:
  title, phase, computed open-task count, domain tags. **Drag a card to
  reprioritize** (persists `order` to the mock).
- **Canvas** — click a tile to enter a dark dot-grid surface. Notes appear as
  blocks with a **colored left edge by type** (note=blue, todo=green,
  scratchpad=amber, text=grey). **Drag blocks** (snaps to grid, persists
  position); **drag empty space to pan**.
- **Expand → paper** — double-click a block to open it full-screen as white
  paper. Read-only for now.

## The one idea that makes tonight easy

Every screen talks to a single interface — [`VaultClient`](src/lib/vault/VaultClient.ts) —
and nothing else. Today the implementation is
[`MockVaultClient`](src/lib/vault/MockVaultClient.ts), seeded from
[real notes](src/lib/vault/seed.ts) pulled out of the vault via MCP. Its methods
mirror the Parachute surface (`query-notes` / `create-note` / `update-note`),
including metadata-merge and optimistic concurrency (`if_updated_at`).

**To go live:** implement `RestVaultClient` (same interface, hitting the BFF) and
return it from [`createVaultClient()`](src/lib/vault/index.ts) when
`VITE_COCKPIT_API` is set. Nothing upstream changes.

## Architecture

```
src/
  lib/
    model/      types + pure mappers (note → Project / Block, subtask parsing)
    vault/      VaultClient interface · MockVaultClient · seed · factory
    canvas/     grid geometry (snap)
    markdown.tsx  tiny read-only markdown renderer
  state/        zustand store (load, reorder, move, expand)
  features/
    home/       HomeScreen · ProjectTile
    canvas/     CanvasView · BlockCard · PaperOverlay
```

## Data model (as seeded, matching the real vault)

- **Project** = a `project`-tagged note at `projects/<slug>`, with
  `metadata.cockpit = { slug, phase, order, domains }` and a `deep` pointer to
  its full status note. (Your real notes already use the `deep` pointer.)
- **Block** = a note tagged by type (`note`/`todo`/`scratchpad`/`text`) **and**
  `project/<slug>`, carrying `metadata.cockpit = { x, y, w, h, z }`.
- **Open-task count** is computed from unchecked `- [ ]` lines in todo blocks —
  not stored.

## Next slices

3. Paper view: inline editing → write-back with `if_updated_at`.
4. Add-block (+), scratchpad → write-to-vault (AI-compress + approve), todo
   subtask reorder/checkoff.

## Bring tonight

- Hub origin + a scoped token (or how the existing Parachute UI authenticates).
- Anthropic key for scratchpad compression (routed through the BFF).
- The React prototype (visual identity).
