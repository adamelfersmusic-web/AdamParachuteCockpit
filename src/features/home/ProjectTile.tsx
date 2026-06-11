import type { Project } from "../../lib/model/types";

export function ProjectTile({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <button className="tile" onClick={onOpen}>
      <div className="tile-top">
        <h2>{project.title}</h2>
        {project.phase && <span className="phase">{project.phase}</span>}
      </div>

      <div className="tile-tasks">
        <span className="task-dot" />
        {project.openTaskCount} open {project.openTaskCount === 1 ? "task" : "tasks"}
      </div>

      <div className="tile-tags">
        {project.domains.map((d) => (
          <span key={d} className="tag">
            {d}
          </span>
        ))}
      </div>

      <span className="tile-open">open →</span>
    </button>
  );
}
