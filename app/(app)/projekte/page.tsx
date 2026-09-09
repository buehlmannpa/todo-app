"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/store";
import PageHeader from "@/components/PageHeader";
import Sheet from "@/components/Sheet";
import {
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconFlag,
  IconFolder,
  IconPlus,
} from "@/components/Icons";
import { PROJECT_COLORS, type ProjectColor } from "@/lib/types";

type SortMode = "alphabetisch" | "manuell";

export default function ProjektePage() {
  const { projects, countOpen, hasHighPriority, createProject, moveProject } = useStore();
  const [sortMode, setSortMode] = useState<SortMode>("alphabetisch");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<ProjectColor>("blue");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("klar-projekt-sortierung");
    if (stored === "manuell" || stored === "alphabetisch") setSortMode(stored);
  }, []);

  const changeSort = (mode: SortMode) => {
    setSortMode(mode);
    window.localStorage.setItem("klar-projekt-sortierung", mode);
  };

  const ordered = useMemo(() => {
    if (sortMode === "manuell") return projects;
    return [...projects].sort((a, b) => a.name.localeCompare(b.name, "de-CH"));
  }, [projects, sortMode]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    const project = await createProject(trimmed, color);
    setSaving(false);
    if (project) {
      setName("");
      setColor("blue");
      setCreating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Projekte"
        subtitle={`${projects.length} ${projects.length === 1 ? "Projekt" : "Projekte"}`}
        actions={
          <button type="button" className="chip" onClick={() => setCreating(true)}>
            <IconPlus size={15} /> Neu
          </button>
        }
      />

      <div className="chips" style={{ marginBottom: 14, padding: "0 4px" }}>
        <button
          type="button"
          className="chip"
          data-on={sortMode === "alphabetisch"}
          onClick={() => changeSort("alphabetisch")}
        >
          Alphabetisch
        </button>
        <button
          type="button"
          className="chip"
          data-on={sortMode === "manuell"}
          onClick={() => changeSort("manuell")}
        >
          Eigene Reihenfolge
        </button>
      </div>

      {ordered.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-emoji">📁</span>
            Noch keine Projekte. Legen Sie eines an, um Aufgaben zu bündeln.
          </div>
        </div>
      ) : (
        <div className="card">
          {ordered.map((project, index) => {
            const count = countOpen(project.id);
            const urgent = hasHighPriority(project.id);
            return (
              <div key={project.id} className="project-row" style={{ padding: 0 }}>
                <Link
                  href={`/projekte/${project.id}`}
                  className="project-row"
                  style={{ flex: 1, color: "inherit" }}
                >
                  <span
                    className="project-icon"
                    style={{ background: `var(--p-${project.color})` }}
                  >
                    <IconFolder size={16} />
                  </span>
                  <span className="project-name">{project.name}</span>
                  {urgent ? (
                    <span className="flame" title="Enthält Aufgaben mit hoher Dringlichkeit">
                      <IconFlag size={12} />
                    </span>
                  ) : null}
                  <span className="project-count">{count}</span>
                  <IconChevronRight size={16} style={{ color: "var(--ink-4)" }} />
                </Link>

                {sortMode === "manuell" ? (
                  <div style={{ display: "flex", gap: 2, paddingRight: 12 }}>
                    <button
                      type="button"
                      className="reorder-btn"
                      aria-label="Nach oben"
                      disabled={index === 0}
                      onClick={() => void moveProject(project.id, -1)}
                    >
                      <IconChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="reorder-btn"
                      aria-label="Nach unten"
                      disabled={index === ordered.length - 1}
                      onClick={() => void moveProject(project.id, 1)}
                    >
                      <IconChevronDown size={15} />
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {creating ? (
        <Sheet title="Neues Projekt" onClose={() => setCreating(false)}>
          <div className="field">
            <label className="label" htmlFor="project-name">
              Name
            </label>
            <input
              id="project-name"
              className="input"
              autoFocus
              value={name}
              placeholder="Zum Beispiel Neubau Bahnhofstrasse"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submit();
              }}
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

          <div className="row" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
              Abbrechen
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!name.trim() || saving}
              onClick={() => void submit()}
            >
              Anlegen
            </button>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}
