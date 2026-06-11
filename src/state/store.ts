import { create } from "zustand";
import type { Block, Project } from "../lib/model/types";
import { buildBlock, buildProject, slugOf } from "../lib/model/mappers";
import type { VaultClient } from "../lib/vault";

type View = { screen: "home" } | { screen: "canvas"; slug: string };

interface CockpitState {
  // null until a vault is connected (OAuth) or the demo/mock is chosen.
  client: VaultClient | null;
  view: View;
  projects: Project[];
  blocks: Record<string, Block[]>;
  loading: boolean;
  error?: string;
  expandedBlockId?: string;

  setClient: (client: VaultClient | null) => void;
  loadProjects: () => Promise<void>;
  openProject: (slug: string) => void;
  goHome: () => void;
  reorderProjects: (from: number, to: number) => Promise<void>;
  moveBlock: (slug: string, id: string, x: number, y: number) => Promise<void>;
  expandBlock: (id?: string) => void;
}

export const useCockpit = create<CockpitState>()((set, get) => ({
  client: null,
  view: { screen: "home" },
  projects: [],
  blocks: {},
  loading: false,

  setClient: (client) => set({ client }),

  // Primes everything in one pass: project tiles + each canvas's blocks, so
  // open-task counts are accurate on the home screen and opening a canvas is
  // instant.
  loadProjects: async () => {
    const { client } = get();
    if (!client) return;
    set({ loading: true, error: undefined });
    try {
      const projectNotes = await client.listProjects();
      const blocks: Record<string, Block[]> = {};
      const projects: Project[] = [];
      for (const pn of projectNotes) {
        const slug = slugOf(pn);
        const blockNotes = await client.getBlocks(slug);
        const built = blockNotes.map(buildBlock).sort((a, b) => a.z - b.z);
        blocks[slug] = built;
        projects.push(buildProject(pn, built));
      }
      projects.sort((a, b) => a.order - b.order);
      set({ projects, blocks, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  openProject: (slug) => set({ view: { screen: "canvas", slug }, expandedBlockId: undefined }),
  goHome: () => set({ view: { screen: "home" }, expandedBlockId: undefined }),
  expandBlock: (id) => set({ expandedBlockId: id }),

  // Drag-to-reorder priority. Optimistic locally, then persist each moved tile's
  // order (full cockpit object, since metadata merges key-by-key).
  reorderProjects: async (from, to) => {
    const projects = [...get().projects];
    if (from === to || from < 0 || to < 0 || from >= projects.length || to >= projects.length) return;
    const [moved] = projects.splice(from, 1);
    projects.splice(to, 0, moved);
    const renumbered = projects.map((p, i) => ({ ...p, order: i + 1 }));
    set({ projects: renumbered });

    const { client } = get();
    if (!client) return;
    await Promise.all(
      renumbered.map((p) => {
        const cockpit = { ...(p.note.metadata.cockpit ?? {}), order: p.order };
        return client
          .updateNote(p.note.id, { metadata: { cockpit } }, p.note.updatedAt)
          .then((updated) => {
            set((s) => ({
              projects: s.projects.map((x) => (x.slug === p.slug ? { ...x, note: updated } : x)),
            }));
          })
          .catch(() => void 0);
      }),
    );
  },

  // Drag a block on the canvas. Optimistic move, then persist position.
  moveBlock: async (slug, id, x, y) => {
    set((s) => ({
      blocks: {
        ...s.blocks,
        [slug]: (s.blocks[slug] ?? []).map((b) => (b.id === id ? { ...b, x, y } : b)),
      },
    }));
    const { client } = get();
    if (!client) return;
    try {
      const note = await client.getNote(id);
      const cockpit = { ...(note.metadata.cockpit ?? {}), x, y };
      const updated = await client.updateNote(id, { metadata: { cockpit } }, note.updatedAt);
      set((s) => ({
        blocks: {
          ...s.blocks,
          [slug]: (s.blocks[slug] ?? []).map((b) => (b.id === id ? { ...b, note: updated } : b)),
        },
      }));
    } catch {
      /* a failed position write is non-fatal */
    }
  },
}));
