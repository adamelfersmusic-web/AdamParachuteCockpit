import { useRef, useState } from "react";

// The scratchpad's editor — shared by the on-canvas pad and the full-screen
// view. Two modes: WRITE (a textarea you dump/paste into) and CHECK (the same
// content rendered with real, clickable checkboxes). The "☑ to-do" button turns
// the current line — or every line you've selected — into a `- [ ]` checkbox.
// Content stays plain markdown text, so it stays portable.

const CB_LINE = /^\s*[-*]\s+\[[ xX]\]\s+/;

export function ScratchEditor({
  content,
  onChange,
  big = false,
  placeholder,
}: {
  content: string;
  onChange: (c: string) => void;
  big?: boolean;
  placeholder?: string;
}) {
  const [mode, setMode] = useState<"write" | "check">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  function applyCheckbox() {
    const ta = ref.current;
    const lines = content.split("\n");
    let a = 0;
    let b = lines.length - 1;
    if (ta) {
      const starts: number[] = [];
      let acc = 0;
      for (const l of lines) {
        starts.push(acc);
        acc += l.length + 1;
      }
      const lineOf = (pos: number) => {
        let idx = 0;
        for (let i = 0; i < lines.length; i++) if (starts[i] <= pos) idx = i;
        return idx;
      };
      a = lineOf(ta.selectionStart);
      b = lineOf(ta.selectionEnd);
    }
    // If every targeted line is already a checkbox, strip them; otherwise add.
    const allCb = lines.slice(a, b + 1).every((l) => l.trim() === "" || CB_LINE.test(l));
    for (let i = a; i <= b; i++) {
      if (lines[i].trim() === "") continue;
      if (allCb) lines[i] = lines[i].replace(/^(\s*)[-*]\s+\[[ xX]\]\s+/, "$1");
      else if (!CB_LINE.test(lines[i])) lines[i] = lines[i].replace(/^(\s*)/, "$1- [ ] ");
    }
    onChange(lines.join("\n"));
    setTimeout(() => ta?.focus(), 0);
  }

  function toggleLine(i: number) {
    const lines = content.split("\n");
    lines[i] = lines[i].replace(
      /^(\s*[-*]\s+\[)([ xX])(\])/,
      (_m, p1, c, p3) => p1 + (c.toLowerCase() === "x" ? " " : "x") + p3,
    );
    onChange(lines.join("\n"));
  }

  return (
    <div className="scratch-editor" onPointerDown={(e) => e.stopPropagation()}>
      <div className="scratch-toolbar">
        <button
          type="button"
          className="stool"
          title="Turn the current line into a checkbox (select several lines to convert them all)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={applyCheckbox}
        >
          ☑ to-do
        </button>
        <button
          type="button"
          className={"stool" + (mode === "check" ? " on" : "")}
          title="Switch between writing and ticking boxes"
          onClick={() => setMode((m) => (m === "write" ? "check" : "write"))}
        >
          {mode === "write" ? "✓ check off" : "✎ edit"}
        </button>
      </div>

      {mode === "write" ? (
        <textarea
          ref={ref}
          className={"scratch-area" + (big ? " big" : "")}
          value={content}
          placeholder={placeholder}
          autoFocus={big}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className={"scratch-check" + (big ? " big" : "")}>
          {content.trim() === "" && (
            <div className="check-empty">Nothing here yet — hit ✎ edit and jot something.</div>
          )}
          {content.split("\n").map((line, i) => {
            const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
            if (m) {
              const done = m[1].toLowerCase() === "x";
              return (
                <label key={i} className={"check-row" + (done ? " done" : "")}>
                  <input type="checkbox" checked={done} onChange={() => toggleLine(i)} />
                  <span>{m[2]}</span>
                </label>
              );
            }
            return (
              <div key={i} className="check-text">
                {line || " "}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
