export type LedgerEntry = { competencia: string; tipo: string; valor: number };
export type ReportMode = "daily" | "monthly" | "annual";
export const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export function financialReport(entries: LedgerEntry[], mode: ReportMode, year: number, month: number) {
  const years = entries.map((entry) => Number(entry.competencia.slice(0, 4)));
  const firstYear = Math.min(year, ...years);
  const lastYear = Math.max(year, ...years);
  const count = mode === "daily" ? new Date(year, month, 0).getDate() : mode === "monthly" ? 12 : lastYear - firstYear + 1;
  return Array.from({ length: count }, (_, index) => {
    const key = mode === "daily" ? `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}` : mode === "monthly" ? `${year}-${String(index + 1).padStart(2, "0")}` : String(firstYear + index);
    const matching = entries.filter((entry) => entry.competencia.startsWith(key));
    const receita = matching.filter((entry) => entry.tipo === "receita").reduce((sum, entry) => sum + Number(entry.valor), 0);
    const estorno = matching.filter((entry) => entry.tipo === "estorno").reduce((sum, entry) => sum + Number(entry.valor), 0);
    return { key, label: mode === "daily" ? String(index + 1).padStart(2, "0") : mode === "monthly" ? MONTHS[index] ?? "" : key, receita, estorno, saldo: receita - estorno };
  });
}