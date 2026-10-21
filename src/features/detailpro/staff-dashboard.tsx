import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChartNoAxesCombined, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listPainel, concluirAgendamento, estornarAgendamento, cancelBooking } from "@/lib/bookings.functions";
import { Button } from "@/components/ui/button";
import { StaffBookingForm } from "./staff-booking-form";
import { FinancialCharts } from "./financial-charts";

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const payments = [{ value: "pix", label: "Pix" }, { value: "dinheiro", label: "Dinheiro" }, { value: "cartao_credito", label: "Crédito" }, { value: "cartao_debito", label: "Débito" }] as const;
export function StaffDashboard({ view }: { view: "staff" | "finance" }) {
  const getPanel = useServerFn(listPainel);
  const complete = useServerFn(concluirAgendamento);
  const refund = useServerFn(estornarAgendamento);
  const cancel = useServerFn(cancelBooking);
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [payment, setPayment] = React.useState<Record<string, typeof payments[number]["value"]>>({});
  const [refundId, setRefundId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [filter, setFilter] = React.useState("agendado");
  const query = useQuery({ queryKey: ["staff-panel"], queryFn: () => getPanel(), enabled: signedIn === true, retry: false });
  React.useEffect(() => { let active = true; supabase.auth.getUser().then(({ data }) => { if (active) setSignedIn(Boolean(data.user)); }); return () => { active = false; }; }, []);
  const refresh = async () => { await query.refetch(); };
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await fn(); await refresh(); setRefundId(""); setReason(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a operação."); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5"><Button asChild variant="link"><Link to="/">DETAILPRO</Link></Button><nav className="flex gap-2"><Button asChild variant={view === "staff" ? "default" : "outline"}><Link to="/funcionarios"><CalendarDays />Atendimentos</Link></Button><Button asChild variant={view === "finance" ? "default" : "outline"}><Link to="/financeiro"><ChartNoAxesCombined />Financeiro</Link></Button></nav></div></header>
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10">
      <div className="flex items-center justify-between gap-4"><div><p className="mb-3 text-xs uppercase text-muted-foreground">Equipe DetailPro</p><h1 className="text-2xl font-semibold sm:text-3xl">{view === "staff" ? "Painel dos funcionários" : "Painel financeiro"}</h1></div>{query.data && <Button variant="outline" size="icon" title="Atualizar painel" aria-label="Atualizar painel" onClick={() => void refresh()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "animate-spin motion-reduce:animate-none" : ""} /></Button>}</div>
      {signedIn === null && <p>Verificando acesso…</p>}
      {signedIn === false && <Button asChild><Link to="/login" search={{ service: undefined }}>Entrar com conta da equipe</Link></Button>}
      {signedIn && query.isPending && <p>Carregando…</p>}
      {query.error && <p role="alert" className="text-chart-refund">{query.error.message.includes("restrito") ? "Sua conta não tem acesso aos painéis da equipe." : "Não foi possível carregar o painel. Tente atualizar."}</p>}
      {query.data && <>
        {view === "finance" ? <FinancialCharts entries={query.data.lancamentos} /> : <StaffBookingForm onSaved={refresh} />}
        {error && <p role="alert" className="text-chart-refund">{error}</p>}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Agendamentos</h2><select aria-label="Filtrar agendamentos" className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="agendado">Em aberto</option><option value="todos">Todos</option><option value="concluido">Concluídos</option><option value="cancelado">Cancelados</option><option value="estornado">Estornados</option></select></div>
          <ul className="divide-y divide-border">{query.data.agendamentos.filter((a) => filter === "todos" || a.status === filter).map((a) => <li key={a.id} className="flex flex-wrap items-center gap-4 py-5">
            <div className="min-w-0 flex-1 basis-60"><p className="font-semibold">{a.agendamento_itens[0]?.servico_nome ?? "Serviço"}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(a.data_hora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })} · {a.local} · {a.status}</p>{a.cliente_presencial_nome && <p className="mt-2 break-words text-sm">{a.cliente_presencial_nome}{a.cliente_presencial_telefone ? ` · ${a.cliente_presencial_telefone}` : ""}<span className="ml-2 text-xs text-primary">Presencial</span></p>}{a.veiculo_presencial_placa && <p className="text-xs text-muted-foreground">{a.veiculo_presencial_placa} · {a.veiculo_presencial_modelo}</p>}</div>
            <b className="text-primary">{brl(a.valor_total)}</b>
            {a.status === "agendado" && <div className="flex flex-wrap items-center gap-2"><select aria-label={`Pagamento de ${a.cliente_presencial_nome ?? a.agendamento_itens[0]?.servico_nome ?? "serviço"}`} className="rounded-md border border-input bg-background px-2 py-2 text-sm" value={payment[a.id] ?? "pix"} onChange={(e) => { const selected = payments.find((p) => p.value === e.target.value); if (selected) setPayment((v) => ({ ...v, [a.id]: selected.value })); }}>{payments.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select><Button disabled={busy} onClick={() => void act(() => complete({ data: { id: a.id, formaPagamento: payment[a.id] ?? "pix" } }))}>Concluir</Button>{a.cliente_presencial_nome && <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm("Cancelar este atendimento?")) void act(() => cancel({ data: { id: a.id } })); }}>Cancelar</Button>}</div>}
            {a.status === "concluido" && <Button variant="outline" disabled={busy} onClick={() => { setRefundId(a.id); setReason(""); }}>Estornar</Button>}
            {refundId === a.id && <form className="flex w-full flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); void act(() => refund({ data: { id: a.id, motivo: reason } })); }}><input aria-label="Motivo do estorno" required minLength={3} maxLength={500} className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo do estorno" /><Button disabled={busy}>Confirmar estorno</Button><Button type="button" variant="ghost" onClick={() => setRefundId("")}>Voltar</Button></form>}
          </li>)}</ul>
          {!query.data.agendamentos.some((a) => filter === "todos" || a.status === filter) && <p className="text-sm text-muted-foreground">Nenhum agendamento neste filtro.</p>}
        </section>
      </>}
    </main>
  </div>;
}