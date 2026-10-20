import { BookingPanel } from "@/components/ui/booking-panel";
import * as React from "react";
import { getService } from "@/features/detailpro/services";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useNavigate } from "@tanstack/react-router";
import { loginDestination } from "@/features/detailpro/login-destination";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

type Mode = "entrar" | "cadastrar" | "recuperar";

const SignIn1 = ({ serviceId }: { serviceId?: string | undefined }) => {
  const selectedService = getService(serviceId);
  const [mode, setMode] = React.useState<Mode>("entrar");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [user, setUser] = React.useState<{ id: string; email?: string } | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user);
        if (!data.user) setChecking(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setChecking(Boolean(session?.user));
      setUserEmail(null);
      setUser(session?.user ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  React.useEffect(() => {
    if (!user) return;
    let active = true;
    const resolveDestination = async () => {
      setChecking(true);
      setError("");
      try {
        const results = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "financeiro" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "funcionario" }),
        ]);
        if (!active) return;
        const failed = results.find((result) => result.error);
        if (failed?.error) throw failed.error;
        const roles = results.flatMap((result, index) => result.data ? [index === 0 ? "financeiro" : "funcionario"] : []);
        if (loginDestination(roles) === "/financeiro") {
          await navigate({ to: "/financeiro", replace: true });
          return;
        }
        setUserEmail(user.email ?? "");
        setChecking(false);
      } catch {
        if (active) {
          setError("Não foi possível verificar seu acesso. Tente entrar novamente.");
          setChecking(false);
        }
      }
    };
    void resolveDestination();
    return () => { active = false; };
  }, [user, navigate]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!validateEmail(email.trim()) || email.length > 255) return setError("Informe um e-mail válido.");
    setBusy(true);
    try {
      if (mode === "recuperar") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setNotice("Enviamos um link de redefinição para o seu e-mail.");
        return;
      }
      if (!password) return setError("Informe a senha.");
      if (mode === "cadastrar") {
        if (name.trim().length < 2) return setError("Informe seu nome.");
        if (password.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { nome: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setNotice("Conta criada! Confirme seu e-mail para entrar.");
        setMode("entrar");
        return;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error && err.message.includes("Invalid login")
        ? "E-mail ou senha incorretos."
        : err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    // Return to this public page, preserving only the catalog-validated service ID.
    const callback = new URL("/login", window.location.origin);
    if (selectedService) callback.searchParams.set("service", selectedService.id);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: callback.href });
    if (result.error) setError("Não foi possível entrar com o Google. Tente novamente.");
  };

  const input =
    "w-full px-6 py-4 rounded-full bg-foreground/[0.07] border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition";

  const signedIn = Boolean(userEmail);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden w-full px-4 py-16">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className={`relative z-10 w-full ${signedIn ? "max-w-2xl px-2 sm:px-4 py-4" : "max-w-md px-8 sm:px-12 py-14"} rounded-[2rem] bg-card/70 border border-border backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] flex flex-col items-center`}>
        {checking ? <p className="text-sm text-muted-foreground" role="status">Verificando seu acesso…</p> : signedIn ? (
          <BookingPanel email={userEmail ?? ""} selectedService={selectedService} />
        ) : (
          <>
            <a href="/" className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 border border-primary/40 flex items-center justify-center mb-5 shadow-[0_10px_30px_-8px_var(--primary)]">
                <span className="text-xl font-bold text-primary-foreground" style={{ fontFamily: "var(--hf)" }}>DP</span>
              </div>
              <b className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--hf)" }}>
                DETAIL<span className="text-primary">PRO</span>
              </b>
              <span className="text-xs text-muted-foreground mt-2 tracking-[0.25em] uppercase">
                {mode === "cadastrar" ? "Crie sua conta" : mode === "recuperar" ? "Recuperar senha" : "Entre para agendar"}
              </span>
            </a>

            {selectedService && <div className="w-full mb-6 border-y border-border py-4 text-center"><p className="text-sm font-semibold">{selectedService.name}</p><p className="mt-2 text-sm text-primary">{selectedService.price} · {selectedService.time}</p></div>}

            <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
              {mode === "cadastrar" && (
                <input placeholder="Nome completo" type="text" maxLength={120} value={name} className={input} onChange={(e) => setName(e.target.value)} />
              )}
              <input placeholder="E-mail" type="email" maxLength={255} value={email} className={input} onChange={(e) => setEmail(e.target.value)} />
              {mode !== "recuperar" && (
                <input placeholder="Senha" type="password" maxLength={72} value={password} className={input} onChange={(e) => setPassword(e.target.value)} />
              )}
              {error && <div className="text-sm text-primary text-center" role="alert">{error}</div>}
              {notice && <div className="text-sm text-muted-foreground text-center" role="status">{notice}</div>}

              <button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground font-semibold px-6 py-4 rounded-full hover:bg-primary-hover hover:-translate-y-0.5 transition text-sm mt-3 shadow-[0_12px_30px_-10px_var(--primary)] disabled:opacity-50">
                {busy ? "Aguarde…" : mode === "cadastrar" ? "Criar conta" : mode === "recuperar" ? "Enviar link de redefinição" : "Entrar"}
              </button>

              {mode === "entrar" && (
                <>
                  <div className="flex items-center gap-4 my-2">
                    <span className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <span className="flex-1 h-px bg-border" />
                  </div>
                  <button type="button" onClick={handleGoogle} className="w-full bg-foreground/[0.07] border border-border text-foreground font-medium px-6 py-4 rounded-full hover:bg-foreground/[0.12] transition text-sm flex items-center justify-center gap-3">
                    <GoogleIcon />
                    Continuar com o Google
                  </button>
                </>
              )}

              <span className="text-sm text-muted-foreground text-center mt-4 space-x-3">
                {mode === "entrar" ? (
                  <>
                    <button type="button" onClick={() => { setMode("cadastrar"); setError(""); setNotice(""); }} className="underline text-foreground/80 hover:text-foreground">Inscreva-se, é grátis!</button>
                    <button type="button" onClick={() => { setMode("recuperar"); setError(""); setNotice(""); }} className="underline text-foreground/80 hover:text-foreground">Esqueci a senha</button>
                  </>
                ) : (
                  <button type="button" onClick={() => { setMode("entrar"); setError(""); setNotice(""); }} className="underline text-foreground/80 hover:text-foreground">Voltar para o login</button>
                )}
              </span>
            </form>
          </>
        )}
      </div>

      <p className="relative z-10 mt-12 text-sm text-muted-foreground text-center">
        Junte-se a <b className="text-foreground font-semibold">milhares</b> de clientes que confiam na DetailPro.
      </p>
    </div>
  );
};

export { SignIn1 };
export default SignIn1;
