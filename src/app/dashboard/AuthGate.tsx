"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isTokenValid } from "@/lib/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "redirecting">(
    "checking",
  );

  useEffect(() => {
    function check() {
      const t = getToken();
      if (!isTokenValid(t)) {
        setStatus("redirecting");
        router.replace("/dashboard/login");
        return;
      }
      setStatus("ok");
    }
    check();
    const onAuth = () => check();
    window.addEventListener("fps-auth-changed", onAuth);
    return () => window.removeEventListener("fps-auth-changed", onAuth);
  }, [router]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-[12px] text-muted">
          {status === "redirecting" ? "Redirecting to sign-in…" : "Checking session…"}
        </div>
      </div>
    );
  }
  return <>{children}</>;
}