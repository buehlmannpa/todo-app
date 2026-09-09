import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Konto erstellen bei Klar" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth" />}>
      <AuthForm mode="registrieren" />
    </Suspense>
  );
}
