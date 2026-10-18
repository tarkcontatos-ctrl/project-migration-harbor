import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { listPainel, concluirAgendamento, estornarAgendamento } from "@/lib/bookings.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Painel financeiro — DetailPro" },
      { name: "description", content: "Livro-caixa e agendamentos da DetailPro. Acesso restrito à equipe." },
      { property: "og:title", content: "Painel financeiro — DetailPro" },
      { property: "og:description", content: "Livro-caixa e agendamentos da DetailPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceiroPage,
});

type Agendamento = { id: string; data_hora: string; status: string; local: string; valor_total: number; forma_pagamento: string | null; agendamento_itens: { servico_nome: string }[] };
type Lancamento = { id: number; competencia: string; tipo: string; servico_nome: string; quantidade: number; valor: number; forma_pagamento: string; motivo: string | null };

const brl = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const PAGAMENTOS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Crédito" },
  { value: "cartao_debito", label: "Débito" },
] as const;

function FinanceiroPage() {
  const [state, setState] = React.useState<"checking" | "login" | "denied" | "ok">("checking");
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([]);
  const [lancamentos, setLancamentos] = React.useState<Lancamento[]>([]);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await listPainel();
      setAgendamentos(data.agendamentos as Agendamento[]);
      setLancamentos(data.lancamentos as Lancamento[]);
      setState("ok");
    } catch (err) {
      setState(err instanceof Error && err.message.includes("restrito") ? "denied" : "login");
    }
  }, []);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setState("login"); return; }
      void load();
    });
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await fn(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Operação falhou."); }
    finally { setBusy(false); }
  };

  const receita = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
  const estorno = lancamentos.filter((l) => l.tipo === "estorno").reduce((s, l) => s + Number(l.valor), 0);

  const card = "rounded-2xl border border-border bg-card p-6";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5"><span className="w-8 h-0.5 bg-primary" />Equipe</p>
        <h1 className="text-3xl md:text-5xl font-medium leading-tight mb-10" style={{ fontFamily: "var(--hf)" }}>Painel financeiro</h1>

        {state === "checking" && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {state === "login" && <p className="text-sm text-muted-foreground">Entre com uma conta da equipe pela página de login.</p>}
        {state === "denied" && <p className="text-sm text-muted-foreground">Sua conta não tem acesso ao painel financeiro.</p>}

        {state === "ok" && (
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={card}><p className="text-xs text-muted-foreground mb-1">Receitas</p><p className="text-2xl font-semibold text-primary">{brl(receita)}</p></div>
              <div className={card}><p className="text-xs text-muted-foreground mb-1">Estornos</p><p className="text-2xl font-semibold">{brl(estorno)}</p></div>
              <div className={card}><p className="text-xs text-muted-foreground mb-1">Saldo</p><p className="text-2xl font-semibold">{brl(receita - estorno)}</p></div>
            </div>

            {error && <p className="text-sm text-primary" role="alert">{error}</p>}

            <section>
              <h2 className="text-lg font-semibold mb-4">Agendamentos</h2>
              <ul className="space-y-2">
                {agendamentos.map((a) => (
                  <li key={a.id} className={`${card} !p-4 flex flex-wrap items-center gap-3 text-sm`}>
                    <div className="flex-1 min-w-48">
                      <b className="font-semibold">{a.agendamento_itens[0]?.servico_nome ?? "Serviço"}</b>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(a.data_hora).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {a.local} · {a.status}
                        {a.forma_pagamento ? ` · ${a.forma_pagamento}` : ""}
                      </span>
                    </div>
                    <b className="text-primary">{brl(a.valor_total)}</b>
                    {a.status === "agendado" && (
                      <span className="flex gap-1">
                        {PAGAMENTOS.map((p) => (
                          <Button key={p.value} size="sm" variant="outline" disabled={busy}
                            onClick={() => void act(() => concluirAgendamento({ data: { id: a.id, formaPagamento: p.value } }))}>
                            Concluir · {p.label}
                          </Button>
                        ))}
                      </span>
                    )}
                    {a.status === "concluido" && (
                      <Button size="sm" variant="outline" disabled={busy}
                        onClick={() => {
                          const motivo = window.prompt("Motivo do estorno:");
                          if (motivo) void act(() => estornarAgendamento({ data: { id: a.id, motivo } }));
                        }}>
                        Estornar
                      </Button>
                    )}
                  </li>
                ))}
                {agendamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Livro-caixa</h2>
              <ul className="space-y-2">
                {lancamentos.map((l) => (
                  <li key={l.id} className={`${card} !p-4 flex flex-wrap items-center gap-3 text-sm`}>
                    <div className="flex-1 min-w-48">
                      <b className="font-semibold">{l.servico_nome}</b>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(l.competencia + "T12:00").toLocaleDateString("pt-BR")} · {l.tipo} · {l.forma_pagamento}
                        {l.motivo ? ` · ${l.motivo}` : ""}
                      </span>
                    </div>
                    <b className={l.tipo === "estorno" ? "text-muted-foreground" : "text-primary"}>{l.tipo === "estorno" ? "−" : ""}{brl(l.valor)}</b>
                  </li>
                ))}
                {lancamentos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
