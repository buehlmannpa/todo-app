import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Anmelden bei Klar" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth" />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
