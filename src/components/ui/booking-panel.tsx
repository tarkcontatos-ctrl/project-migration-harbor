import * as React from "react";
import { ChevronLeft, ChevronRight, MapPin, Check, CalendarDays, Trash2, Star, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SERVICES, type Service } from "@/features/detailpro/services";
import { supabase } from "@/integrations/supabase/client";
import { listMyBookings, listTakenSlots, createBooking, cancelBooking } from "@/lib/bookings.functions";

type Booking = { id: string; dateTime: string; status: string; location: string; service: string; price: number };

const LOCATIONS = ["Unidade Centro", "Unidade Zona Sul", "Atendimento em domicílio"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmt = (s: string) => new Date(s).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function BookingPanel({ email, selectedService }: { email: string; selectedService?: Service | undefined }) {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [takenSlots, setTakenSlots] = React.useState<string[]>([]);
  const [week, setWeek] = React.useState(0);
  const [service, setService] = React.useState<Service>(selectedService ?? SERVICES[0]);
  const [location, setLocation] = React.useState(LOCATIONS[0] ?? "");
  const [day, setDay] = React.useState<string | null>(null);
  const [time, setTime] = React.useState<string | null>(null);
  const [placa, setPlaca] = React.useState("");
  const [modelo, setModelo] = React.useState("");
  const [now, setNow] = React.useState<Date | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    try {
      setBookings(await listMyBookings());
    } catch { /* mantém lista atual */ }
  }, []);

  React.useEffect(() => {
    setNow(new Date());
    void refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!day) { setTakenSlots([]); return; }
    listTakenSlots({ data: { date: day, location } })
      .then(setTakenSlots)
      .catch(() => setTakenSlots([]));
  }, [day, location]);

  if (!now) return null;
  const days = Array.from({ length: 6 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() + week * 6 + i); return d; });
  const today = iso(now);
  const taken = (d: string, t: string) => takenSlots.includes(t);
  const past = (d: string, t: string) => d === today && Number(t.slice(0, 2)) <= now.getHours();
  const free = (d: Date) => new Date(d).getDay() !== 0;

  const confirm = async () => {
    if (!day || !time || busy) return;
    if (taken(day, time) || past(day, time)) return;
    setBusy(true); setError("");
    try {
      await createBooking({
        data: {
          service: service.id,
          date: day,
          time,
          location,
          ...(placa && modelo ? { placa, modelo } : {}),
        },
      });
      setTime(null); setDay(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível agendar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    setBusy(true); setError("");
    try {
      await cancelBooking({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cancelar.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const chip = (active: boolean) => cn("rounded-full border px-4 py-2 text-xs font-medium transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border text-soft-foreground hover:border-primary/60");

  return (
    <div className="w-full text-left p-4 sm:p-6 space-y-7">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center font-bold text-primary-foreground" style={{ fontFamily: "var(--hf)" }}>DP</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--hf)" }}>Agende seu horário</h2>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 break-all"><Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" /> 5.0 · Olá, {email}</p>
        </div>
        <button type="button" onClick={signOut} aria-label="Sair da conta" className="text-muted-foreground hover:text-primary transition" title="Sair">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Serviço</p>
        {selectedService ? <p className="font-semibold">{service.name}</p> : <div className="flex flex-wrap gap-2">{SERVICES.map((s) => <Button variant="ghost" key={s.id} type="button" onClick={() => setService(s)} className={cn(chip(s.id === service.id), "h-auto whitespace-normal")}>{s.name}</Button>)}</div>}
        <p className="mt-3 text-primary font-semibold">{service.price}</p>
        <p className="mt-1 text-xs text-muted-foreground">Duração estimada: {service.time}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Veículo (opcional)</p>
        <div className="flex flex-wrap gap-2">
          <input value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="Placa ABC1D23" maxLength={7} className="rounded-full border border-border bg-background px-4 py-2 text-xs w-36 outline-none focus:border-primary" />
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Modelo (ex.: Corolla)" maxLength={60} className="rounded-full border border-border bg-background px-4 py-2 text-xs flex-1 min-w-40 outline-none focus:border-primary" />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Local</p>
        <div className="flex flex-wrap gap-2">{LOCATIONS.map((l) => <button key={l} type="button" onClick={() => { setLocation(l); setTime(null); }} className={chip(l === location)}><MapPin className="inline w-3.5 h-3.5 mr-1" />{l}</button>)}</div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Data</p>
          <div className="flex gap-2">
            <button type="button" aria-label="Semana anterior" disabled={week === 0} onClick={() => setWeek(week - 1)} className="w-8 h-8 rounded-full border border-border grid place-items-center disabled:opacity-30 hover:border-primary"><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" aria-label="Próxima semana" disabled={week >= 3} onClick={() => setWeek(week + 1)} className="w-8 h-8 rounded-full border border-border grid place-items-center disabled:opacity-30 hover:border-primary"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {days.map((d) => {
            const k = iso(d); const ok = free(d);
            return (
              <button key={k} type="button" disabled={!ok} onClick={() => { setDay(k); setTime(null); }}
                className={cn("rounded-xl border py-3 text-center transition disabled:opacity-30", day === k ? "border-primary bg-primary/15" : "border-border hover:border-primary/60")}>
                <span className="block text-[11px] text-muted-foreground">{k === today ? "Hoje" : DAYS[d.getDay()]}</span>
                <span className="block text-lg font-semibold">{d.getDate()}</span>
                <span className="block text-[10px] text-muted-foreground">{ok ? "disponível" : "fechado"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {day && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Horários · {fmt(day + "T12:00")}</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {TIMES.map((t) => {
              const off = taken(day, t) || past(day, t);
              return <button key={t} type="button" disabled={off} onClick={() => setTime(t)}
                className={cn("rounded-full border py-2 text-sm transition disabled:opacity-30 disabled:line-through", time === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60")}>{t}</button>;
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-5 space-y-3">
        <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{service.name}</span><b className="text-primary">{service.price}</b></div>
        {day && time && <p className="text-xs text-muted-foreground">{fmt(day + "T12:00")} às {time} · {location}</p>}
        {error && <p className="text-sm text-primary" role="alert">{error}</p>}
        <Button type="button" disabled={!day || !time || busy} onClick={confirm} className="w-full h-auto py-4 rounded-full whitespace-normal hover:bg-primary-hover">{busy ? "Aguarde…" : day && time ? "Confirmar agendamento" : "Escolha data e horário"}</Button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Meus agendamentos</p>
        {bookings.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p> : (
          <ul className="space-y-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Check className="w-4 h-4 text-primary" />
                <div className="flex-1 min-w-0 text-sm">
                  <b className="font-semibold">{b.service}</b>
                  <span className="block text-xs text-muted-foreground">{fmt(b.dateTime)} às {new Date(b.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {b.location}</span>
                  <span className="block text-xs text-primary mt-1">{brl(b.price)} · {b.status}</span>
                </div>
                {b.status === "agendado" && (
                  <button type="button" aria-label="Cancelar agendamento" disabled={busy} onClick={() => void cancel(b.id)} className="text-muted-foreground hover:text-primary"><Trash2 className="w-4 h-4" /></button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
