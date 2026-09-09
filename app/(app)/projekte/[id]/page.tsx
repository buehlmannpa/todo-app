"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/components/store";
import TodoList from "@/components/TodoList";
import Sheet from "@/components/Sheet";
import { IconChevronLeft, IconEdit, IconPlus, IconTrash } from "@/components/Icons";
import { PRIORITY_ORDER, PROJECT_COLORS, type ProjectColor } from "@/lib/types";

export default function ProjektPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { projects, todos, openQuickAdd, updateProject, deleteProject } = useStore();

  const project = projects.find((item) => item.id === params.id) ?? null;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [color, setColor] = useState<ProjectColor>(project?.color ?? "blue");
  const [showDone, setShowDone] = useState(false);

  const { open, done } = useMemo(() => {
    const mine = todos.filter((todo) => todo.projectId === params.id);
    return {
      open: mine
        .filter((todo) => !todo.completedAt)
        .sort((a, b) => {
          const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (priority !== 0) return priority;
          if (a.dueAt && b.dueAt) return a.dueAt < b.dueAt ? -1 : 1;
          if (a.dueAt) return -1;
          if (b.dueAt) return 1;
          return a.createdAt > b.createdAt ? -1 : 1;
        }),
      done: mine
        .filter((todo) => todo.completedAt)
        .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1)),
    };
  }, [params.id, todos]);

  if (!project) {
    return (
      <>
        <div className="page-head">
          <Link href="/projekte" className="chip">
            <IconChevronLeft size={15} /> Projekte
          </Link>
        </div>
        <div className="card">
          <div className="empty">Dieses Projekt existiert nicht mehr.</div>
        </div>
      </>
    );
  }

  const save = async () => {
    await updateProject(project.id, { name: name.trim() || project.name, color });
    setEditing(false);
  };

  const remove = async () => {
    if (!window.confirm("Projekt löschen? Die Aufgaben wandern zurück in den Eingang.")) return;
    await deleteProject(project.id);
    router.push("/projekte");
  };

  const high = open.filter((todo) => todo.priority === "high").length;

  return (
    <>
      <div className="page-head">
        <div>
          <Link
            href="/projekte"
            className="page-sub"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 6 }}
          >
            <IconChevronLeft size={14} /> Projekte
          </Link>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="dot"
              style={{ width: 12, height: 12, background: `var(--p-${project.color})` }}
            />
            {project.name}
          </h1>
          <p className="page-sub">
            {open.length} offen{high > 0 ? `, ${high} mit hoher Dringlichkeit` : ""}
          </p>
        </div>
        <div className="spread" style={{ gap: 4 }}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Projekt bearbeiten"
            onClick={() => {
              setName(project.name);
              setColor(project.color);
              setEditing(true);
            }}
          >
            <IconEdit size={17} />
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => openQuickAdd({ projectId: project.id })}
          >
            <IconPlus size={15} /> Neu
          </button>
        </div>
      </div>

      <TodoList
        todos={open}
        showProject={false}
        emptyEmoji="✅"
        emptyText="In diesem Projekt ist alles erledigt."
      />

      {done.length > 0 ? (
        <section className="section" style={{ marginTop: 22 }}>
          <button
            type="button"
            className="section-head"
            style={{ width: "100%" }}
            onClick={() => setShowDone((value) => !value)}
          >
            <span className="section-title">Erledigt</span>
            <span className="section-count">{done.length}</span>
            <span className="section-count" style={{ marginLeft: "auto" }}>
              {showDone ? "ausblenden" : "anzeigen"}
            </span>
          </button>
          {showDone ? <TodoList todos={done} showProject={false} /> : null}
        </section>
      ) : null}

      {editing ? (
        <Sheet title="Projekt bearbeiten" onClose={() => setEditing(false)}>
          <div className="field">
            <label className="label" htmlFor="edit-name">
              Name
            </label>
            <input
              id="edit-name"
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="field">
            <span className="label">Farbe</span>
            <div className="chips">
              {PROJECT_COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Farbe ${value}`}
                  onClick={() => setColor(value)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `var(--p-${value})`,
                    border: color === value ? "2.5px solid var(--ink)" : "2.5px solid transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger btn-full"
            style={{ marginBottom: 12 }}
            onClick={() => void remove()}
          >
            <IconTrash size={15} /> Projekt löschen
          </button>

          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void save()}>
              Sichern
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
