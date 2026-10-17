import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SERVICE_SLUGS = ["lavagem", "higienizacao", "polimento", "ceramica"] as const;

const bookingInput = z.object({
  service: z.enum(SERVICE_SLUGS),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(2).max(80),
  placa: z.string().max(7).optional(),
  modelo: z.string().max(60).optional(),
});

type BookingRow = {
  id: string;
  data_hora: string;
  status: string;
  local: string;
  valor_total: number;
  agendamento_itens: { servico_nome: string; subtotal: number }[];
};

const mapBooking = (row: BookingRow) => ({
  id: row.id,
  dateTime: row.data_hora,
  status: row.status,
  location: row.local,
  total: row.valor_total,
  service: row.agendamento_itens[0]?.servico_nome ?? "Serviço",
  price: row.agendamento_itens[0]?.subtotal ?? row.valor_total,
});

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agendamentos")
      .select("id, data_hora, status, local, valor_total, agendamento_itens(servico_nome, subtotal)")
      .order("data_hora", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BookingRow[]).map(mapBooking);
  });

// Horários ocupados: público, devolve apenas horários (sem dados pessoais).
export const listTakenSlots = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string; location: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dayStart = `${data.date}T00:00:00-03:00`;
    const dayEnd = `${data.date}T23:59:59-03:00`;
    const { data: rows, error } = await supabaseAdmin
      .from("agendamentos")
      .select("data_hora")
      .eq("local", data.location)
      .eq("status", "agendado")
      .gte("data_hora", dayStart)
      .lte("data_hora", dayEnd);
    if (error) throw new Error(error.message);
    return rows.map((r) => {
      const d = new Date(r.data_hora);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    });
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => bookingInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Preço e nome vêm SEMPRE do cadastro de serviços, nunca do cliente.
    const { data: servico, error: sErr } = await supabase
      .from("servicos")
      .select("id")
      .eq("slug", data.service)
      .eq("ativo", true)
      .single();
    if (sErr || !servico) throw new Error("Serviço indisponível.");

    let veiculoId: string | null = null;
    if (data.placa && data.modelo) {
      const placa = data.placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const { data: veiculo, error: vErr } = await supabase
        .from("veiculos")
        .upsert({ usuario_id: userId, placa, modelo: data.modelo }, { onConflict: "usuario_id,placa" })
        .select("id")
        .single();
      if (vErr) throw new Error("Dados do veículo inválidos (placa no formato ABC1D23).");
      veiculoId = veiculo.id;
    }

    const dataHora = `${data.date}T${data.time}:00-03:00`;

    // Conflito de horário: verificação privilegiada (RLS esconde agendamentos de outros clientes).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conflito } = await supabaseAdmin
      .from("agendamentos")
      .select("id")
      .eq("local", data.location)
      .eq("status", "agendado")
      .eq("data_hora", dataHora)
      .maybeSingle();
    if (conflito) throw new Error("Este horário acabou de ser reservado. Escolha outro.");

    const { data: agendamento, error: aErr } = await supabase
      .from("agendamentos")
      .insert({ usuario_id: userId, veiculo_id: veiculoId, local: data.location, data_hora: dataHora })
      .select("id")
      .single();
    if (aErr) throw new Error(aErr.message);

    const { error: iErr } = await supabase
      .from("agendamento_itens")
      .insert({ agendamento_id: agendamento.id, servico_id: servico.id });
    if (iErr) {
      await supabase.from("agendamentos").delete().eq("id", agendamento.id);
      throw new Error(iErr.message);
    }
    return { id: agendamento.id };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", data.id)
      .eq("usuario_id", context.userId)
      .eq("status", "agendado");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== Painel financeiro (funcionário/financeiro) =====================

async function requireStaff(supabase: typeof import("@/integrations/supabase/client") extends never ? never : any, userId: string) {
  const { data: isStaff } = await supabase.rpc("has_role", { _user_id: userId, _role: "funcionario" });
  const { data: isFinanceiro } = await supabase.rpc("has_role", { _user_id: userId, _role: "financeiro" });
  if (!isStaff && !isFinanceiro) throw new Error("Acesso restrito à equipe DetailPro.");
}

export const listPainel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: agendamentos, error: e1 }, { data: lancamentos, error: e2 }] = await Promise.all([
      supabaseAdmin
        .from("agendamentos")
        .select("id, data_hora, status, local, valor_total, forma_pagamento, agendamento_itens(servico_nome)")
        .order("data_hora", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("lancamentos_financeiros")
        .select("id, competencia, tipo, servico_nome, quantidade, valor, forma_pagamento, motivo")
        .order("competencia", { ascending: false })
        .limit(200),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { agendamentos: agendamentos ?? [], lancamentos: lancamentos ?? [] };
  });

export const concluirAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; formaPagamento: "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" }) => input)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("agendamentos")
      .update({ status: "concluido", forma_pagamento: data.formaPagamento })
      .eq("id", data.id)
      .eq("status", "agendado");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const estornarAgendamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; motivo: string }) => input)
  .handler(async ({ data, context }) => {
    await requireStaff(context.supabase, context.userId);
    if (!data.motivo || data.motivo.trim().length < 3) throw new Error("Informe o motivo do estorno.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("agendamentos")
      .update({ status: "estornado", motivo_estorno: data.motivo.trim() })
      .eq("id", data.id)
      .eq("status", "concluido");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
