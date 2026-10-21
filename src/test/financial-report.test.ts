import { describe, expect, it } from "vitest";
import { financialReport } from "@/features/detailpro/financial-report";
describe("Financial periods", () => {
  const entries = [{ competencia: "2026-10-20", tipo: "receita", valor: 280 }, { competencia: "2026-10-21", tipo: "estorno", valor: 120 }, { competencia: "2025-01-01", tipo: "receita", valor: 650 }];
  it("includes every day of the selected month including zero days", () => {
    const rows = financialReport(entries, "daily", 2026, 10);
    expect(rows).toHaveLength(31);
    expect(rows[0]?.saldo).toBe(0);
    expect(rows[19]?.receita).toBe(280);
    expect(rows[20]?.saldo).toBe(-120);
  });
  it("includes all twelve months and subtracts refunds without mixing years", () => {
    const rows = financialReport(entries, "monthly", 2026, 10);
    expect(rows).toHaveLength(12);
    expect(rows[9]?.saldo).toBe(160);
    expect(rows[0]?.receita).toBe(0);
  });
  it("includes every year between first revenue and current selection", () => {
    expect(financialReport(entries, "annual", 2027, 10).map((r) => r.saldo)).toEqual([650, 160, 0]);
  });
  it("keeps leap-year February complete", () => {
    expect(financialReport([], "daily", 2028, 2)).toHaveLength(29);
  });
});