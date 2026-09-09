"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Bootstrap, Project, ProjectColor, SessionUser, Todo } from "@/lib/types";

export type TodoPatch = Partial<
  Pick<
    Todo,
    | "title"
    | "notes"
    | "link"
    | "starred"
    | "priority"
    | "projectId"
    | "dueAt"
    | "dueAllDay"
    | "durationMinutes"
    | "remindAt"
    | "repeatMode"
    | "repeatUnit"
    | "repeatInterval"
    | "position"
  >
>;

export type NewTodo = TodoPatch & { title: string };

interface StoreValue {
  user: SessionUser;
  projects: Project[];
  todos: Todo[];
  openTodos: Todo[];
  doneTodos: Todo[];
  inboxTodos: Todo[];
  projectById: (id: string | null) => Project | null;
  countOpen: (projectId: string | null) => number;
  hasHighPriority: (projectId: string | null) => boolean;

  createTodo: (input: NewTodo) => Promise<Todo | null>;
  updateTodo: (id: string, patch: TodoPatch) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  setCompleted: (id: string, completed: boolean) => Promise<void>;

  createProject: (name: string, color: ProjectColor) => Promise<Project | null>;
  updateProject: (id: string, patch: { name?: string; color?: ProjectColor }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  moveProject: (id: string, direction: -1 | 1) => Promise<void>;

  detailId: string | null;
  openDetail: (id: string | null) => void;
  quickAdd: { open: boolean; projectId: string | null; dueAt: string | null };
  openQuickAdd: (options?: { projectId?: string | null; dueAt?: string | null }) => void;
  closeQuickAdd: () => void;
  notify: (message: string) => void;
  toast: string | null;
  refresh: () => Promise<void>;
}

const Store = createContext<StoreValue | null>(null);

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Die Anfrage ist fehlgeschlagen.");
  return data;
}

export function StoreProvider({ initial, children }: { initial: Bootstrap; children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [todos, setTodos] = useState<Todo[]>(initial.todos);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [quickAdd, setQuickAdd] = useState({
    open: false,
    projectId: null as string | null,
    dueAt: null as string | null,
  });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await request<Bootstrap>("/api/bootstrap");
      setProjects(data.projects);
      setTodos(data.todos);
    } catch {
      // Beim nächsten Fokus wird es erneut versucht.
    }
  }, []);

  // Nach dem Zurückkehren in die App die Daten frisch holen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  const createTodo = useCallback(
    async (input: NewTodo): Promise<Todo | null> => {
      try {
        const data = await request<{ todo: Todo }>("/api/todos", {
          method: "POST",
          body: JSON.stringify(input),
        });
        setTodos((current) => [data.todo, ...current]);
        return data.todo;
      } catch (error) {
        notify((error as Error).message);
        return null;
      }
    },
    [notify],
  );

  const updateTodo = useCallback(
    async (id: string, patch: TodoPatch) => {
      const previous = todos;
      setTodos((current) =>
        current.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
      );
      try {
        const data = await request<{ todo: Todo }>(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        setTodos((current) => current.map((todo) => (todo.id === id ? data.todo : todo)));
      } catch (error) {
        setTodos(previous);
        notify((error as Error).message);
      }
    },
    [notify, todos],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      const previous = todos;
      setTodos((current) => current.filter((todo) => todo.id !== id));
      setDetailId((current) => (current === id ? null : current));
      try {
        await request(`/api/todos/${id}`, { method: "DELETE" });
        notify("Aufgabe gelöscht");
      } catch (error) {
        setTodos(previous);
        notify((error as Error).message);
      }
    },
    [notify, todos],
  );

  const setCompleted = useCallback(
    async (id: string, completed: boolean) => {
      const previous = todos;
      const stamp = new Date().toISOString();
      setTodos((current) =>
        current.map((todo) =>
          todo.id === id ? { ...todo, completedAt: completed ? stamp : null } : todo,
        ),
      );
      try {
        const data = await request<{ todo: Todo; created: Todo | null }>(
          `/api/todos/${id}/complete`,
          { method: "POST", body: JSON.stringify({ completed }) },
        );
        setTodos((current) => {
          const next = current.map((todo) => (todo.id === id ? data.todo : todo));
          return data.created ? [data.created, ...next] : next;
        });
        if (data.created) notify("Wiederholung neu geplant");
      } catch (error) {
        setTodos(previous);
        notify((error as Error).message);
      }
    },
    [notify, todos],
  );

  const createProject = useCallback(
    async (name: string, color: ProjectColor): Promise<Project | null> => {
      try {
        const data = await request<{ project: Project }>("/api/projects", {
          method: "POST",
          body: JSON.stringify({ name, color }),
        });
        setProjects((current) => [...current, data.project]);
        return data.project;
      } catch (error) {
        notify((error as Error).message);
        return null;
      }
    },
    [notify],
  );

  const updateProject = useCallback(
    async (id: string, patch: { name?: string; color?: ProjectColor }) => {
      const previous = projects;
      setProjects((current) =>
        current.map((project) => (project.id === id ? { ...project, ...patch } : project)),
      );
      try {
        await request(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      } catch (error) {
        setProjects(previous);
        notify((error as Error).message);
      }
    },
    [notify, projects],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const previousProjects = projects;
      const previousTodos = todos;
      setProjects((current) => current.filter((project) => project.id !== id));
      setTodos((current) =>
        current.map((todo) => (todo.projectId === id ? { ...todo, projectId: null } : todo)),
      );
      try {
        await request(`/api/projects/${id}`, { method: "DELETE" });
        notify("Projekt gelöscht, die Aufgaben liegen im Eingang");
      } catch (error) {
        setProjects(previousProjects);
        setTodos(previousTodos);
        notify((error as Error).message);
      }
    },
    [notify, projects, todos],
  );

  const moveProject = useCallback(
    async (id: string, direction: -1 | 1) => {
      const index = projects.findIndex((project) => project.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= projects.length) return;

      const reordered = [...projects];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);
      const withPositions = reordered.map((project, position) => ({ ...project, position }));

      const previous = projects;
      setProjects(withPositions);
      try {
        await request("/api/projects/reorder", {
          method: "POST",
          body: JSON.stringify({ order: withPositions.map((project) => project.id) }),
        });
      } catch (error) {
        setProjects(previous);
        notify((error as Error).message);
      }
    },
    [notify, projects],
  );

  const value = useMemo<StoreValue>(() => {
    const openTodos = todos.filter((todo) => !todo.completedAt);
    const doneTodos = todos
      .filter((todo) => todo.completedAt)
      .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));

    return {
      user: initial.user,
      projects,
      todos,
      openTodos,
      doneTodos,
      inboxTodos: openTodos.filter((todo) => !todo.projectId),
      projectById: (id) => (id ? projects.find((project) => project.id === id) ?? null : null),
      countOpen: (projectId) =>
        openTodos.filter((todo) => todo.projectId === projectId).length,
      hasHighPriority: (projectId) =>
        openTodos.some((todo) => todo.projectId === projectId && todo.priority === "high"),
      createTodo,
      updateTodo,
      deleteTodo,
      setCompleted,
      createProject,
      updateProject,
      deleteProject,
      moveProject,
      detailId,
      openDetail: setDetailId,
      quickAdd,
      openQuickAdd: (options) =>
        setQuickAdd({
          open: true,
          projectId: options?.projectId ?? null,
          dueAt: options?.dueAt ?? null,
        }),
      closeQuickAdd: () => setQuickAdd({ open: false, projectId: null, dueAt: null }),
      notify,
      toast,
      refresh,
    };
  }, [
    createProject,
    createTodo,
    deleteProject,
    deleteTodo,
    detailId,
    initial.user,
    moveProject,
    notify,
    projects,
    quickAdd,
    refresh,
    setCompleted,
    toast,
    todos,
    updateProject,
    updateTodo,
  ]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(Store);
  if (!value) throw new Error("useStore muss innerhalb des StoreProvider verwendet werden.");
  return value;
}
