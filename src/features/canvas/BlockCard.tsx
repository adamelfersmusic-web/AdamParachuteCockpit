import { useEffect, useRef, useState } from "react";
import type { Block } from "../../lib/model/types";
import { renderMarkdown } from "../../lib/markdown";
import { snap } from "../../lib/canvas/geometry";

export function BlockCard({
  block,
  onMove,
  onExpand,
  onToggleCollapse,
}: {
  block: Block;
  onMove: (x: number, y: number) => void;
  onExpand: () => void;
  onToggleCollapse: () => void;
}) {
  const [pos, setPos] = useState({ x: block.x, y: block.y });
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(
    null,
  );

  // Mirror store position when we're not actively dragging (e.g. after persist).
  useEffect(() => {
    if (!drag.current) setPos({ x: block.x, y: block.y });
  }, [block.x, block.y]);

  return (
    <div
      className={`block block-${block.type}` + (block.collapsed ? " collapsed" : "")}
      style={{
        left: pos.x,
        top: pos.y,
        width: block.w,
        minHeight: block.collapsed ? undefined : block.h,
        zIndex: block.z,
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest(".block-collapse")) return;
        e.stopPropagation();
        drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.sx;
        const dy = e.clientY - drag.current.sy;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.current.moved = true;
        setPos({ x: drag.current.ox + dx, y: drag.current.oy + dy });
      }}
      onPointerUp={(e) => {
        if (!drag.current) return;
        const sx = snap(pos.x);
        const sy = snap(pos.y);
        setPos({ x: sx, y: sy });
        if (drag.current.moved) onMove(sx, sy);
        drag.current = null;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest(".block-collapse")) return;
        e.stopPropagation();
        onExpand();
      }}
    >
      <button
        className="block-collapse"
        title={block.collapsed ? "Expand" : "Collapse"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
      >
        {block.collapsed ? "▸" : "▾"}
      </button>

      <div className="block-head">
        <span className="block-type">{block.type}</span>
        <h3>{block.title}</h3>
      </div>

      {!block.collapsed && (
        <div className="block-body">
          {block.type === "todo" ? (
            <div className="block-tasks">
              {block.subtasks.map((s, i) => (
                <div key={i} className={"task" + (s.done ? " done" : "")}>
                  <span className="check">{s.done ? "✓" : ""}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          ) : block.type === "scratchpad" && !block.body.trim() ? (
            <div className="scratch-empty">freeform · dictate or type, then write to vault</div>
          ) : (
            <div className="block-preview">{renderMarkdown(block.body)}</div>
          )}
        </div>
      )}
    </div>
  );
}
