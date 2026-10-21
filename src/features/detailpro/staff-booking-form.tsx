import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createStaffBooking, listStaffServices, listTakenSlots } from "@/lib/bookings.functions";
import { STAFF_LOCATIONS, STAFF_TIMES } from "./staff-booking";

const field = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring";
const brl = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function StaffBookingForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const getServices = useServerFn(listStaffServices);
  const save = useServerFn(createStaffBooking);
  const getSlots = useServerFn(listTakenSlots);
  const { data: services = [], isPending, error: serviceError } = useQuery({ queryKey: ["staff-services"], queryFn: () => getServices() });
  const [service, setService] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [location, setLocation] = React.useState<typeof STAFF_LOCATIONS[number]>("Unidade Centro");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [plate, setPlate] = React.useState("");
  const [model, setModel] = React.useState("");
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const slots = useQuery({ queryKey: ["staff-slots", date, location], queryFn: () => getSlots({ data: { date, location } }), enabled: Boolean(date) });
  const selected = services.find((s) => s.id === service);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setSuccess(false);
    try {
      await save({ data: { service, date, time, location, name, phone, plate, model } });
      await onSaved();
      await slots.refetch();
      setSuccess(true); setName(""); setPhone(""); setPlate(""); setModel(""); setTime("");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível agendar."); }
    finally { setBusy(false); }
  };
  return <section className="border-y border-border py-7">
    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold"><CalendarPlus className="size-5 text-primary" />Novo atendimento presencial</h2>
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-2 text-sm">Nome do cliente<input aria-label="Nome do cliente" className={field} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} /></label>
      <label className="space-y-2 text-sm">Telefone (opcional)<input aria-label="Telefone" type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={25} /></label>
      <label className="space-y-2 text-sm">Serviço<select aria-label="Serviço" className={field} value={service} onChange={(e) => setService(e.target.value)} required disabled={isPending || Boolean(serviceError)}><option value="">{isPending ? "Carregando…" : "Selecionar serviço"}</option>{services.map((s) => <option key={s.id} value={s.id}>{s.nome} · {brl(s.preco)}</option>)}</select></label>
      <label className="space-y-2 text-sm">Data<input aria-label="Data" type="date" className={field} min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required /></label>
      <label className="space-y-2 text-sm">Local<select aria-label="Local" className={field} value={location} onChange={(e) => { const value = STAFF_LOCATIONS.find((l) => l === e.target.value); if (value) setLocation(value); setTime(""); }}>{STAFF_LOCATIONS.map((l) => <option key={l}>{l}</option>)}</select></label>
      <label className="space-y-2 text-sm">Horário<select aria-label="Horário" className={field} value={time} onChange={(e) => setTime(e.target.value)} required disabled={!date || slots.isPending || Boolean(slots.error)}><option value="">Selecionar horário</option>{STAFF_TIMES.map((t) => { const unavailable = slots.data?.includes(t) || new Date(`${date}T${t}:00-03:00`).getTime() <= Date.now() || new Date(`${date}T12:00:00-03:00`).getUTCDay() === 0; return <option key={t} disabled={unavailable} value={t}>{t}{unavailable ? " · indisponível" : ""}</option>; })}</select></label>
      <label className="space-y-2 text-sm">Placa (opcional)<input aria-label="Placa" className={field} placeholder="ABC1D23" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} maxLength={7} pattern="[A-Z]{3}[0-9][A-Z][0-9]{2}" /></label>
      <label className="space-y-2 text-sm">Modelo (opcional)<input aria-label="Modelo" className={field} value={model} onChange={(e) => setModel(e.target.value)} maxLength={60} /></label>
      <div className="flex items-end justify-between gap-4"><span className="text-lg font-semibold text-primary">{selected ? brl(selected.preco) : ""}</span><Button type="submit" disabled={busy || !service || !time || Boolean(slots.error)}><CalendarPlus />{busy ? "Salvando…" : "Agendar cliente"}</Button></div>
      {(error || serviceError || slots.error) && <p role="alert" className="col-span-full text-sm text-chart-refund">{error || "Não foi possível carregar os serviços ou horários. Tente novamente."}</p>}
      {success && <p role="status" className="col-span-full flex items-center gap-2 text-sm text-chart-revenue"><Check className="size-4" />Atendimento agendado e salvo.</p>}
    </form>
  </section>;
}