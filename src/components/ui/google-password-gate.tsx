import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { saveFirstGooglePassword } from "@/lib/google-password.functions";
import { firstPasswordInput } from "@/features/detailpro/google-password";

export function GooglePasswordGate({ children, revision }: { children: ReactNode; revision: number }) {
  const savePassword = useServerFn(saveFirstGooglePassword);
  const [state, setState] = useState<"checking" | "ready" | "pending" | "error">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState("checking");
    void (async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (!data.user) {
          if (active) setState("ready");
          return;
        }
        if (userError) throw userError;
        // Recovery remains accessible so an emailed reset can also establish the first password.
        if (window.location.pathname === "/reset-password") {
          if (active) setState("ready");
          return;
        }
        const { data: pending, error: checkError } = await supabase.rpc("needs_google_password");
        if (checkError) throw checkError;
        if (active) setState(pending ? "pending" : "ready");
      } catch {
        if (active) setState("error");
      }
    })();
    return () => { active = false; };
  }, [revision, attempt]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = firstPasswordInput.safeParse({ password, confirmation });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Verifique sua senha.");
      return;
    }
    setBusy(true);
    try {
      await savePassword({ data: parsed.data });
      setPassword(""); setConfirmation(""); setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a senha.");
    } finally { setBusy(false); }
  }

  if (state === "ready") return children;
  return <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-16">
    {state === "checking" ? <p role="status" className="text-muted-foreground">Verificando seu acesso…</p>
      : state === "error" ? <div className="max-w-md text-center space-y-5">
        <p role="alert">Não foi possível verificar seu cadastro.</p>
        <Button onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</Button>
        <Button variant="ghost" onClick={() => void supabase.auth.signOut()}>Sair</Button>
      </div> : <section className="w-full max-w-md">
        <p className="text-primary font-semibold mb-8">DETAILPRO</p>
        <h1 className="text-2xl font-semibold">Crie sua senha</h1>
        <p className="text-muted-foreground mt-3 mb-8">Falta apenas definir uma senha para concluir seu cadastro.</p>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2"><label htmlFor="first-password" className="text-sm">Nova senha</label>
            <input id="first-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-2"><label htmlFor="confirm-password" className="text-sm">Confirmar senha</label>
            <input id="confirm-password" type="password" autoComplete="new-password" maxLength={72} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-md border border-input bg-card px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full h-12">{busy ? "Salvando…" : "Salvar senha e continuar"}</Button>
          <Button type="button" variant="ghost" disabled={busy} className="w-full" onClick={() => void supabase.auth.signOut()}>Sair</Button>
        </form>
      </section>}
  </main>;
}