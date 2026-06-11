import { useEffect } from "react";
import type { Block } from "../../lib/model/types";
import { renderMarkdown } from "../../lib/markdown";

export function PaperOverlay({ block, onClose }: { block: Block; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="paper-backdrop" onClick={onClose}>
      <div className="paper" onClick={(e) => e.stopPropagation()}>
        <div className="paper-meta">
          <span className={`edge edge-${block.type}`} />
          <span className="paper-path">{block.note.path}</span>
          <button className="paper-close" onClick={onClose}>
            close ✕
          </button>
        </div>
        <article className="paper-body">{renderMarkdown(block.note.content)}</article>
        <footer className="paper-foot">
          Read-only preview · inline editing + write-back lands in the next slice
        </footer>
      </div>
    </div>
  );
}
