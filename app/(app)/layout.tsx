import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadProjects, loadTodos } from "@/lib/queries";
import { StoreProvider } from "@/components/store";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [projects, todos] = await Promise.all([loadProjects(user.id), loadTodos(user.id)]);

  return (
    <StoreProvider initial={{ user, projects, todos }}>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
