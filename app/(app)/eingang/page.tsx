"use client";

import { useMemo } from "react";
import { useStore } from "@/components/store";
import PageHeader from "@/components/PageHeader";
import TodoList from "@/components/TodoList";
import { IconPlus } from "@/components/Icons";
import { PRIORITY_ORDER } from "@/lib/types";

export default function EingangPage() {
  const { inboxTodos, openQuickAdd } = useStore();

  const sorted = useMemo(
    () =>
      [...inboxTodos].sort((a, b) => {
        const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priority !== 0) return priority;
        return a.createdAt > b.createdAt ? -1 : 1;
      }),
    [inboxTodos],
  );

  return (
    <>
      <PageHeader
        title="Eingang"
        subtitle="Alles, was noch keinem Projekt zugeordnet ist"
        actions={
          <button
            type="button"
            className="chip"
            onClick={() => openQuickAdd()}
            aria-label="Neue Aufgabe"
          >
            <IconPlus size={15} /> Neu
          </button>
        }
      />

      <TodoList
        todos={sorted}
        emptyEmoji="📥"
        emptyText="Der Eingang ist leer. Neue Aufgaben landen automatisch hier."
      />

      {sorted.length > 0 ? (
        <p className="muted small" style={{ textAlign: "center", marginTop: 16 }}>
          Nach rechts wischen für ein Datum, nach links für ein Projekt.
        </p>
      ) : null}
    </>
  );
}
