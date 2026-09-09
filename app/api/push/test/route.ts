import { NextResponse } from "next/server";
import { currentUser, serverError, unauthorized } from "@/lib/api";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const user = await currentUser();
  if (!user) return unauthorized();

  try {
    const delivered = await sendPushToUser(user.id, {
      title: "Testmitteilung",
      body: "Die Mitteilungen sind korrekt eingerichtet.",
      url: "/heute",
      tag: "test",
    });
    return NextResponse.json({ delivered });
  } catch (error) {
    return serverError(error);
  }
}
