import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — DetailPro" },
      { name: "description", content: "Defina uma nova senha para a sua conta DetailPro." },
      { property: "og:title", content: "Redefinir senha — DetailPro" },
      { property: "og:description", content: "Defina uma nova senha para a sua conta DetailPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [ready, setReady] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError("Não foi possível redefinir. Peça um novo link.");
    setDone(true);
  };

  const input = "w-full px-6 py-4 rounded-full bg-foreground/[0.07] border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md px-8 sm:px-12 py-14 rounded-[2rem] bg-card/70 border border-border backdrop-blur-xl flex flex-col items-center">
        <b className="text-2xl font-semibold tracking-tight mb-8" style={{ fontFamily: "var(--hf)" }}>DETAIL<span className="text-primary">PRO</span></b>
        {done ? (
          <>
            <p className="text-sm text-muted-foreground text-center mb-6">Senha redefinida com sucesso. Você já pode entrar.</p>
            <Link to="/login" search={{ service: undefined }} className="w-full text-center bg-primary text-primary-foreground font-semibold px-6 py-4 rounded-full hover:bg-primary-hover transition text-sm">Ir para o login</Link>
          </>
        ) : ready ? (
          <form onSubmit={submit} className="flex flex-col w-full gap-4">
            <p className="text-sm text-muted-foreground text-center">Defina sua nova senha</p>
            <input placeholder="Nova senha" type="password" maxLength={72} value={password} className={input} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-sm text-primary text-center" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold px-6 py-4 rounded-full hover:bg-primary-hover transition text-sm disabled:opacity-50">{busy ? "Aguarde…" : "Salvar nova senha"}</button>
          </form>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center mb-6">Este link de redefinição é inválido ou expirou.</p>
            <Link to="/login" search={{ service: undefined }} className="underline text-sm text-foreground/80 hover:text-foreground">Voltar para o login</Link>
          </>
        )}
      </div>
    </div>
  );
}
