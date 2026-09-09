"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { useStore } from "./store";
import { IconFolder, IconInbox, IconPlus } from "./Icons";
import { PROJECT_COLORS, type ProjectColor, type Todo } from "@/lib/types";

interface Props {
  todo: Todo;
  onClose: () => void;
}

export default function ProjectSheet({ todo, onClose }: Props) {
  const { projects, updateTodo, createProject } = useStore();
  const [name, setName] = useState("");
  const [color, setColor] = useState<ProjectColor>("blue");
  const [creating, setCreating] = useState(false);

  const assign = async (projectId: string | null) => {
    await updateTodo(todo.id, { projectId });
    onClose();
  };

  const createAndAssign = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    const project = await createProject(trimmed, color);
    setCreating(false);
    if (project) await assign(project.id);
  };

  return (
    <Sheet title="Projekt zuweisen" onClose={onClose}>
      <p className="muted small" style={{ margin: "-8px 0 14px" }}>
        {todo.title}
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <button type="button" className="project-row" onClick={() => void assign(null)}>
          <span className="project-icon" style={{ background: "var(--p-graphite)" }}>
            <IconInbox size={16} />
          </span>
          <span className="project-name">Eingang</span>
          {!todo.projectId ? <span className="project-count">aktuell</span> : null}
        </button>

        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className="project-row"
            onClick={() => void assign(project.id)}
          >
            <span className="project-icon" style={{ background: `var(--p-${project.color})` }}>
              <IconFolder size={16} />
            </span>
            <span className="project-name">{project.name}</span>
            {todo.projectId === project.id ? <span className="project-count">aktuell</span> : null}
          </button>
        ))}
      </div>

      <div className="detail-label">Neues Projekt</div>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          className="input"
          placeholder="Projektname"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void createAndAssign();
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: "none" }}
          disabled={!name.trim() || creating}
          onClick={() => void createAndAssign()}
        >
          <IconPlus size={16} /> Anlegen
        </button>
      </div>

      <div className="chips">
        {PROJECT_COLORS.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`Farbe ${value}`}
            onClick={() => setColor(value)}
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `var(--p-${value})`,
              border: color === value ? "2.5px solid var(--ink)" : "2.5px solid transparent",
            }}
          />
        ))}
      </div>
    </Sheet>
  );
}
