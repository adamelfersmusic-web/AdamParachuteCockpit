import { useEffect, useLayoutEffect, useRef, useState } from "react";

// One unified, always-live scratchpad editor: type freely, and any line can be
// a real inline checkbox you tick in place — no modes, no raw `- [ ]` markdown
// showing. Make a line a checkbox by clicking the box on its left or typing
// "[] " at the start. Enter = new line (inherits checkbox-ness), Backspace at
// the start unticks the checkbox / merges up. Content stays plain markdown.

interface Row {
  id: string;
  box: boolean;
  done: boolean;
  text: string;
}

let _seq = 0;
const uid = () => `r${_seq++}`;

function parse(content: string): Row[] {
  const lines = content.length ? content.split("\n") : [""];
  return lines.map((line) => {
    const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (m) return { id: uid(), box: true, done: m[1].toLowerCase() === "x", text: m[2] };
    return { id: uid(), box: false, done: false, text: line };
  });
}

function serialize(rows: Row[]): string {
  return rows.map((r) => (r.box ? `- [${r.done ? "x" : " "}] ${r.text}` : r.text)).join("\n");
}

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
  const [rows, setRows] = useState<Row[]>(() => parse(content));
  const serialized = serialize(rows);

  // Re-sync from the prop only when it changes externally (e.g. the full-screen
  // view edited it). Local edits make content === serialized, so this no-ops.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (content !== serialized) setRows(parse(content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Push local edits up.
  const firstSer = useRef(true);
  useEffect(() => {
    if (firstSer.current) {
      firstSer.current = false;
      return;
    }
    onChange(serialized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  const inputs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<{ id: string; pos: number } | null>(null);

  function grow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  useLayoutEffect(() => {
    inputs.current.forEach((el) => grow(el));
    const pf = pendingFocus.current;
    if (pf) {
      const el = inputs.current.get(pf.id);
      if (el) {
        el.focus();
        const p = Math.min(pf.pos, el.value.length);
        el.setSelectionRange(p, p);
      }
      pendingFocus.current = null;
    }
  });

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function onText(i: number, value: string) {
    setRows((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r;
        if (!r.box) {
          const mm = value.match(/^\[ ?\]\s(.*)$/);
          if (mm) return { ...r, box: true, done: false, text: mm[1] };
        }
        return { ...r, text: value };
      }),
    );
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    if (e.key === "Enter") {
      e.preventDefault();
      const pos = el.selectionStart;
      const r = rows[i];
      const before = r.text.slice(0, pos);
      const after = r.text.slice(pos);
      const nid = uid();
      setRows((rs) => {
        const copy = rs.slice();
        copy[i] = { ...copy[i], text: before };
        copy.splice(i + 1, 0, { id: nid, box: r.box, done: false, text: after });
        return copy;
      });
      pendingFocus.current = { id: nid, pos: 0 };
    } else if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      const r = rows[i];
      if (r.box) {
        e.preventDefault();
        setRow(i, { box: false });
        pendingFocus.current = { id: r.id, pos: 0 };
      } else if (i > 0) {
        e.preventDefault();
        const prev = rows[i - 1];
        const joinPos = prev.text.length;
        setRows((rs) => {
          const copy = rs.slice();
          copy[i - 1] = { ...copy[i - 1], text: prev.text + r.text };
          copy.splice(i, 1);
          return copy;
        });
        pendingFocus.current = { id: prev.id, pos: joinPos };
      }
    }
  }

  function onPaste(i: number, e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return; // single line — default paste is fine
    e.preventDefault();
    const el = e.currentTarget;
    const pos = el.selectionStart;
    const r = rows[i];
    const before = r.text.slice(0, pos);
    const after = r.text.slice(pos);
    const pasted = parse(text);
    pasted[0] = { ...pasted[0], text: before + pasted[0].text };
    const last = pasted[pasted.length - 1];
    const caret = last.text.length;
    pasted[pasted.length - 1] = { ...last, text: last.text + after };
    const lastId = last.id;
    setRows((rs) => {
      const copy = rs.slice();
      copy.splice(i, 1, ...pasted);
      return copy;
    });
    pendingFocus.current = { id: lastId, pos: caret };
  }

  return (
    <div
      className={"scratch-list" + (big ? " big" : "")}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {rows.map((r, i) => (
        <div key={r.id} className={"row" + (r.box ? " is-box" : "") + (r.done ? " done" : "")}>
          {r.box ? (
            <input
              type="checkbox"
              className="row-check"
              checked={r.done}
              onChange={() => setRow(i, { done: !r.done })}
            />
          ) : (
            <button
              type="button"
              className="row-toggle"
              title="Make this a checkbox"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setRow(i, { box: true })}
            />
          )}
          <textarea
            ref={(el) => {
              if (el) inputs.current.set(r.id, el);
              else inputs.current.delete(r.id);
            }}
            className="row-text"
            rows={1}
            value={r.text}
            placeholder={i === 0 && rows.length === 1 && r.text === "" ? placeholder : ""}
            onChange={(e) => {
              onText(i, e.target.value);
              grow(e.target);
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
          />
        </div>
      ))}
    </div>
  );
}
