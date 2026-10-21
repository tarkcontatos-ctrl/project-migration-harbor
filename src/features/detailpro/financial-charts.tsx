import * as React from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { financialReport, MONTHS, type LedgerEntry, type ReportMode } from "./financial-report";

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const config = { receita: { label: "Receitas", color: "var(--chart-revenue)" }, estorno: { label: "Estornos", color: "var(--chart-refund)" }, saldo: { label: "Saldo", color: "var(--chart-balance)" } };
export function FinancialCharts({ entries }: { entries: (LedgerEntry & { servico_nome?: string; forma_pagamento?: string; motivo?: string | null })[] }) {
  const [mode, setMode] = React.useState<ReportMode>("monthly");
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const years = Array.from(new Set([new Date().getFullYear(), year, ...entries.map((e) => Number(e.competencia.slice(0, 4)))])).sort((a, b) => b - a);
  const rows = financialReport(entries, mode, year, month);
  const totals = rows.reduce((a, r) => ({ receita: a.receita + r.receita, estorno: a.estorno + r.estorno, saldo: a.saldo + r.saldo }), { receita: 0, estorno: 0, saldo: 0 });
  const [expanded, setExpanded] = React.useState(false);
  return <section className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Período financeiro">{([{ value: "daily", label: "Diário" }, { value: "monthly", label: "Mensal" }, { value: "annual", label: "Anual" }] as const).map((m) => <Button key={m.value} variant={mode === m.value ? "default" : "outline"} aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>{m.label}</Button>)}</div>
      <div className="flex gap-3">{mode !== "annual" && <label className="flex items-center gap-2 text-sm">Ano<select aria-label="Ano" className="rounded-md border border-input bg-background px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>}{mode === "daily" && <label className="flex items-center gap-2 text-sm">Mês<select aria-label="Mês" className="max-w-40 rounded-md border border-input bg-background px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">{([{ key: "receita", label: "Receitas", color: "text-chart-revenue" }, { key: "estorno", label: "Estornos", color: "text-chart-refund" }, { key: "saldo", label: "Saldo", color: "text-chart-balance" }] as const).map((s) => <div key={s.key} className="rounded-lg border border-border bg-card p-5"><p className="mb-2 text-xs text-muted-foreground">{s.label}</p><p className={`break-words text-2xl font-semibold ${s.color}`}>{brl(totals[s.key])}</p></div>)}</div>
    <div className="border-y border-border py-6">
      <h2 className="mb-5 text-lg font-semibold">{mode === "daily" ? `${MONTHS[month - 1]} de ${year}` : mode === "monthly" ? `Movimento mensal · ${year}` : "Movimento anual"}</h2>
      <ChartContainer config={config} className="h-72 w-full aspect-auto sm:h-80"><ComposedChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={(v: string) => mode === "monthly" ? v.slice(0, 3) : v} minTickGap={12} />
        <YAxis tickLine={false} axisLine={false} width={58} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR")} mil` : String(v)} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <span>{config[name as keyof typeof config]?.label ?? name}: {brl(Number(value))}</span>} />} />
        <Bar dataKey="receita" fill="var(--color-receita)" radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
        <Bar dataKey="estorno" fill="var(--color-estorno)" radius={[3, 3, 0, 0]} maxBarSize={30} isAnimationActive={false} />
        <Line dataKey="saldo" stroke="var(--color-saldo)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart></ChartContainer>
      <div className="mt-4 flex justify-center gap-5 text-xs"><span className="text-chart-revenue">● Receitas</span><span className="text-chart-refund">● Estornos</span><span className="text-chart-balance">— Saldo</span></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="mb-3 text-left font-semibold">{mode === "daily" ? "Todos os dias" : mode === "monthly" ? "Todos os meses" : "Todos os anos"}</caption><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-3">Período</th><th className="px-3 text-right">Receitas</th><th className="px-3 text-right">Estornos</th><th className="pl-3 text-right">Saldo</th></tr></thead><tbody>{rows.map((r) => <tr key={r.key} className="border-b border-border"><td className="py-3">{r.label}</td><td className="whitespace-nowrap px-3 text-right">{brl(r.receita)}</td><td className="whitespace-nowrap px-3 text-right">{brl(r.estorno)}</td><td className="whitespace-nowrap pl-3 text-right font-semibold">{brl(r.saldo)}</td></tr>)}</tbody></table></div>
    <Button variant="outline" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Ocultar livro-caixa" : "Abrir livro-caixa"}</Button>
    {expanded && <ul className="divide-y divide-border">{entries.filter((e) => rows.some((r) => e.competencia.startsWith(r.key))).map((e, i) => <li key={i} className="flex justify-between gap-3 py-3 text-sm"><span><b className="block font-semibold">{e.servico_nome ?? "Serviço"}</b>{e.competencia.split("-").reverse().join("/")} · {e.tipo} · {e.forma_pagamento?.replaceAll("_", " ")}{e.motivo && <span className="block text-muted-foreground">{e.motivo}</span>}</span><span className="whitespace-nowrap">{e.tipo === "estorno" ? "−" : ""}{brl(e.valor)}</span></li>)}{!entries.some((e) => rows.some((r) => e.competencia.startsWith(r.key))) && <li className="text-sm text-muted-foreground">Nenhum lançamento neste período.</li>}</ul>}
  </section>;
}