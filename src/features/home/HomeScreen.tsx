import { useState } from "react";
import { useCockpit } from "../../state/store";
import { ProjectTile } from "./ProjectTile";

export function HomeScreen() {
  const projects = useCockpit((s) => s.projects);
  const loading = useCockpit((s) => s.loading);
  const error = useCockpit((s) => s.error);
  const openProject = useCockpit((s) => s.openProject);
  const reorderProjects = useCockpit((s) => s.reorderProjects);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <div className="home">
      <header className="home-header">
        <div>
          <h1>Adam's Cockpit</h1>
          <p className="subtitle">Active projects · drag a card to reprioritize</p>
        </div>
        <span className="badge">mock vault · {projects.length} projects</span>
      </header>

      {loading && <div className="muted">Loading from vault…</div>}
      {error && <div className="error">⚠ {error}</div>}

      <div className="tile-grid">
        {projects.map((p, i) => {
          const isDropTarget = overIndex === i && dragIndex !== null && dragIndex !== i;
          return (
            <div
              key={p.slug}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={() => {
                if (dragIndex !== null) void reorderProjects(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={
                "tile-slot" +
                (isDropTarget ? " drop-target" : "") +
                (dragIndex === i ? " dragging" : "")
              }
            >
              <ProjectTile project={p} onOpen={() => openProject(p.slug)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
