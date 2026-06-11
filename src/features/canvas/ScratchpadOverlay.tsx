import { useEffect } from "react";
import { ScratchEditor } from "./ScratchEditor";

// Full-screen, distraction-free scratchpad. Edits the same content as the
// on-canvas pad. Esc to exit.
export function ScratchpadOverlay({
  content,
  onChange,
  onClose,
}: {
  content: string;
  onChange: (content: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="scratch-full">
      <div className="scratch-full-bar">
        <span className="scratch-full-title">Scratchpad</span>
        <span className="scratch-full-hint">saved automatically · Esc to exit</span>
        <button className="scratch-full-done" onClick={onClose}>
          done ✕
        </button>
      </div>
      <ScratchEditor
        big
        content={content}
        onChange={onChange}
        placeholder="Full-screen scratch. Think out loud here."
      />
    </div>
  );
}
