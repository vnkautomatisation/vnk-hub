"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Identifiants invalides");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ background: "var(--bg-base)" }}>
      <Logo size={40} showSubtext />
      <Card className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-lg font-medium" style={{ color: "var(--text-1)" }}>
            Connexion
          </h1>

          <div className="space-y-1">
            <label htmlFor="email" className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Courriel
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-[13px]" style={{ color: "var(--text-2)" }}>
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-[13px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
