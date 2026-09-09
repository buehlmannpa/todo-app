"use client";

import { useState } from "react";
import TodoRow from "./TodoRow";
import DateSheet from "./DateSheet";
import ProjectSheet from "./ProjectSheet";
import type { Todo } from "@/lib/types";

interface Props {
  todos: Todo[];
  showProject?: boolean;
  emptyText?: string;
  emptyEmoji?: string;
}

export default function TodoList({
  todos,
  showProject = true,
  emptyText = "Hier ist gerade nichts offen.",
  emptyEmoji = "✨",
}: Props) {
  const [dateTodo, setDateTodo] = useState<Todo | null>(null);
  const [projectTodo, setProjectTodo] = useState<Todo | null>(null);

  if (todos.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <span className="empty-emoji">{emptyEmoji}</span>
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        {todos.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            showProject={showProject}
            onSwipeDate={setDateTodo}
            onSwipeProject={setProjectTodo}
          />
        ))}
      </div>

      {dateTodo ? <DateSheet todo={dateTodo} onClose={() => setDateTodo(null)} /> : null}
      {projectTodo ? (
        <ProjectSheet todo={projectTodo} onClose={() => setProjectTodo(null)} />
      ) : null}
    </>
  );
}
