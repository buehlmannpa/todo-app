import { NextResponse } from "next/server";
import { currentUser, serverError, unauthorized } from "@/lib/api";
import { loadProjects, loadTodos } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    const [projects, todos] = await Promise.all([loadProjects(user.id), loadTodos(user.id)]);
    return NextResponse.json({ user, projects, todos });
  } catch (error) {
    return serverError(error);
  }
}
