import type { ReactNode } from "react";

// A deliberately tiny markdown renderer for read-only previews and the paper
// overlay. Handles headings, checkbox tasks, bullets, bold, and [[wikilinks]] —
// enough to make the real note bodies legible. Not a full parser by design.

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\)|\*(.+?)\*/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) nodes.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2] !== undefined)
      nodes.push(
        <span key={k++} className="md-link">
          {m[2].split("/").pop()}
        </span>,
      );
    else if (m[3] !== undefined) nodes.push(<span key={k++} className="md-link">{m[3]}</span>);
    else if (m[5] !== undefined) nodes.push(<em key={k++}>{m[5]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderMarkdown(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let key = 0;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) {
      out.push(<p key={key++}>{inline(para.join(" "))}</p>);
      para = [];
    }
  };

  for (const raw of src.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      flushPara();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^#\s+(.*)/))) {
      flushPara();
      out.push(<h1 key={key++}>{inline(m[1])}</h1>);
    } else if ((m = line.match(/^##\s+(.*)/))) {
      flushPara();
      out.push(<h2 key={key++}>{inline(m[1])}</h2>);
    } else if ((m = line.match(/^###\s+(.*)/))) {
      flushPara();
      out.push(<h3 key={key++}>{inline(m[1])}</h3>);
    } else if ((m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)/))) {
      flushPara();
      const done = m[1].toLowerCase() === "x";
      out.push(
        <div key={key++} className={"md-task" + (done ? " done" : "")}>
          <span className="md-check">{done ? "✓" : ""}</span>
          <span>{inline(m[2])}</span>
        </div>,
      );
    } else if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      flushPara();
      out.push(
        <div key={key++} className="md-li">
          {inline(m[1])}
        </div>,
      );
    } else {
      para.push(line.trim());
    }
  }
  flushPara();
  return out;
}
