import { useRef } from "react";
import type { ScratchState } from "../../lib/scratch";

// The on-canvas scratchpad: drag by its header, type in the body, drag the
// corner to resize, double-click the header (or hit ⤢) for full screen. All of
// content/position/size flow up via onChange and get persisted by CanvasView.
export function ScratchpadBlock({
  state,
  onChange,
  onExpand,
}: {
  state: ScratchState;
  onChange: (s: ScratchState) => void;
  onExpand: () => void;
}) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);

  return (
    <div
      className="block block-scratchpad scratch"
      style={{ left: state.x, top: state.y, width: state.w, height: state.h, zIndex: 5 }}
    >
      <div
        className="scratch-head"
        onPointerDown={(e) => {
          // Let the expand button receive its own click — don't capture the pointer.
          if ((e.target as HTMLElement).closest(".scratch-expand")) return;
          e.stopPropagation();
          drag.current = { sx: e.clientX, sy: e.clientY, ox: state.x, oy: state.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          onChange({
            ...state,
            x: drag.current.ox + (e.clientX - drag.current.sx),
            y: drag.current.oy + (e.clientY - drag.current.sy),
          });
        }}
        onPointerUp={(e) => {
          drag.current = null;
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
      >
        <span className="block-type">scratchpad</span>
        <button
          className="scratch-expand"
          title="Full screen"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
        >
          ⤢
        </button>
      </div>

      <textarea
        className="scratch-area"
        value={state.content}
        placeholder="Dump thoughts here — copy bits from your notes and organize. Saved automatically."
        onChange={(e) => onChange({ ...state, content: e.target.value })}
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />

      <div
        className="scratch-resize"
        title="Drag to resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          resize.current = { sx: e.clientX, sy: e.clientY, ow: state.w, oh: state.h };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!resize.current) return;
          onChange({
            ...state,
            w: Math.max(220, resize.current.ow + (e.clientX - resize.current.sx)),
            h: Math.max(160, resize.current.oh + (e.clientY - resize.current.sy)),
          });
        }}
        onPointerUp={(e) => {
          resize.current = null;
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }}
      />
    </div>
  );
}
