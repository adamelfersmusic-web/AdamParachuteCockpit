import { useEffect, useRef } from "react";

// Full-screen, distraction-free scratchpad editor. Edits the same content as the
// on-canvas pad (so closing leaves everything where you left it). Esc to exit.
export function ScratchpadOverlay({
  content,
  onChange,
  onClose,
}: {
  content: string;
  onChange: (content: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
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
      <textarea
        ref={ref}
        className="scratch-full-area"
        value={content}
        placeholder="Full-screen scratch. Think out loud here."
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
