import { useEffect, useRef, useState } from "react";
import type { Block } from "../../lib/model/types";
import { useCockpit } from "../../state/store";
import { BlockCard } from "./BlockCard";
import { PaperOverlay } from "./PaperOverlay";
import { ScratchpadBlock } from "./ScratchpadBlock";
import { ScratchpadOverlay } from "./ScratchpadOverlay";
import { loadScratch, saveScratch, type ScratchState } from "../../lib/scratch";

const EMPTY: Block[] = [];

export function CanvasView({ slug }: { slug: string }) {
  const project = useCockpit((s) => s.projects.find((p) => p.slug === slug));
  const blocks = useCockpit((s) => s.blocks[slug] ?? EMPTY);
  const goHome = useCockpit((s) => s.goHome);
  const moveBlock = useCockpit((s) => s.moveBlock);
  const toggleCollapse = useCockpit((s) => s.toggleCollapse);
  const expandBlock = useCockpit((s) => s.expandBlock);
  const expandedId = useCockpit((s) => s.expandedBlockId);
  const expanded = blocks.find((b) => b.id === expandedId);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  // Per-project scratchpad — content/size/position persisted in localStorage so
  // it always picks up where you left off.
  const [scratch, setScratch] = useState<ScratchState>(() => loadScratch(slug));
  const [scratchFull, setScratchFull] = useState(false);
  useEffect(() => {
    setScratch(loadScratch(slug));
    setScratchFull(false);
    setPan({ x: 0, y: 0 });
  }, [slug]);
  useEffect(() => {
    const t = setTimeout(() => saveScratch(slug, scratch), 350);
    return () => clearTimeout(t);
  }, [slug, scratch]);

  return (
    <div className="canvas-screen">
      <header className="canvas-header">
        <button className="back" onClick={goHome}>
          ← Cockpit
        </button>
        <div className="canvas-title">
          <h2>{project?.title ?? slug}</h2>
          {project?.phase && <span className="phase">{project.phase}</span>}
        </div>
        <span className="hint">drag blocks · drag empty space to pan · double-click to open</span>
      </header>

      <div
        className="canvas-surface"
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget) return;
          panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!panRef.current) return;
          setPan({
            x: panRef.current.ox + (e.clientX - panRef.current.sx),
            y: panRef.current.oy + (e.clientY - panRef.current.sy),
          });
        }}
        onPointerUp={() => {
          panRef.current = null;
        }}
      >
        <div className="canvas-world" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
          {blocks.map((b) => (
            <BlockCard
              key={b.id}
              block={b}
              onMove={(x, y) => void moveBlock(slug, b.id, x, y)}
              onExpand={() => expandBlock(b.id)}
              onToggleCollapse={() => toggleCollapse(slug, b.id)}
            />
          ))}
          <ScratchpadBlock
            state={scratch}
            onChange={setScratch}
            onExpand={() => setScratchFull(true)}
          />
        </div>
      </div>

      {expanded && <PaperOverlay block={expanded} onClose={() => expandBlock(undefined)} />}
      {scratchFull && (
        <ScratchpadOverlay
          content={scratch.content}
          onChange={(content) => setScratch((s) => ({ ...s, content }))}
          onClose={() => setScratchFull(false)}
        />
      )}
    </div>
  );
}
