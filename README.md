# Adam's Cockpit

A spatial project cockpit on top of the **Adam Parachute vault** — a sibling UI to
Adam's Deck on the same vault. Open a project and your notes lay out as draggable
blocks on a dot-grid; double-click one to read it as full-screen paper.

**Live:** https://adamelfersmusic-web.github.io/AdamParachuteCockpit/
→ click **Connect with OAuth**, sign in to your hub, and you're on your real vault.

## What it does

- **Home** — a tile per project (`project`-tagged notes), with phase, open-task
  count, and domains. Drag a card to reprioritize.
- **Canvas** — click a project → a dark dot-grid. Your notes appear as blocks
  with a colored left edge by type (note=blue, todo=green, scratchpad=amber,
  text=grey). On a project with nothing placed yet, the canvas auto-fills from
  that project's deep status note — one block per section. Drag to rearrange,
  drag empty space to pan.
- **Paper** — double-click a block to open it full-screen as clean white paper
  (read-only for now).

## Safety: it never touches Adam's Deck

Both apps share one vault. A firewall in the vault layer (`src/lib/vault/guard.ts`)
guarantees the Cockpit never writes a `deck`/`deck/*` note or any Deck-owned
metadata key. Proven by `npm test`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + bundle
npm test         # firewall + unit tests
```

Pushes to `main` auto-build and deploy to GitHub Pages via
`.github/workflows/deploy.yml`.

## How it connects

Browser OAuth 2.1 + PKCE straight to the vault's REST API (plumbing reused from
Adam's Deck). The token lives only in your browser's `localStorage` and is sent
only to your vault. Everything the UI does goes through one `VaultClient`
interface, so the transport stays swappable.
