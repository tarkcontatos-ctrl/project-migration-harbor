import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Droplets, Sparkles, Shield, Armchair, Clock, Award, Leaf, BadgeCheck, Star, Phone, Mail, MapPin, Instagram, Send, ArrowRight, CalendarCheck, Search, Wrench, Car } from "lucide-react";
import { SERVICES } from "./services";
import { Button } from "@/components/ui/button";
import { contactSchema, contactEmailUrl } from "./contact-validation";
import { supabase } from "@/integrations/supabase/client";

function AuthLink() {
  const [email, setEmail] = React.useState<string | null>(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const [open, setOpen] = React.useState(false);
  if (email) {
    return (
      <div className="relative">
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="rounded-full border border-primary px-6 py-3 text-[13px] font-semibold hover:bg-primary hover:text-primary-foreground transition">Entrar</button>
        {open && (
          <div className="absolute right-0 mt-2 z-50 w-64 rounded-2xl border border-border bg-card p-4 shadow-lg">
            <p className="text-xs text-muted-foreground">Conectado como</p>
            <p className="text-sm font-semibold truncate mb-4">{email}</p>
            <Link to="/login" search={{ service: undefined }} onClick={() => setOpen(false)} className="block text-sm py-2 hover:text-primary">Meus agendamentos</Link>
            <button type="button" onClick={() => { setOpen(false); void supabase.auth.signOut(); }} className="block w-full text-left text-sm py-2 text-primary hover:underline">Sair</button>
          </div>
        )}
      </div>
    );
  }
  return <Link to="/login" search={{ service: undefined }} className="rounded-full border border-primary px-6 py-3 text-[13px] font-semibold hover:bg-primary hover:text-primary-foreground transition">Entrar</Link>;
}

const NAV = [
  { to: "/servicos", label: "Serviços" },
  { to: "/vantagens", label: "Vantagens" },
  { to: "/etapas", label: "Etapas" },
  { to: "/avaliacoes", label: "Avaliações" },
  { to: "/contato", label: "Contato" },
] as const;

const H = { fontFamily: "var(--hf)" };

export function Shell({ eyebrow, title, intro, children, showBookingCta = true }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; showBookingCta?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between gap-6">
          <Link to="/" className="leading-none">
            <b className="text-lg font-semibold" style={H}>DETAIL<span className="text-primary">PRO</span></b>
            <small className="block text-[10px] text-muted-foreground mt-1">estética automotiva</small>
          </Link>
          <nav className="hidden md:flex gap-10 text-sm text-soft-foreground">
            {NAV.map((n) => <Link key={n.to} to={n.to} className="hover:text-primary" activeProps={{ className: "text-primary" }}>{n.label}</Link>)}
          </nav>
          <AuthLink />
        </div>
        <nav className="md:hidden flex gap-5 overflow-x-auto px-6 pb-4 text-sm text-soft-foreground">
          {NAV.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap" activeProps={{ className: "text-primary" }}>{n.label}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5"><span className="w-8 h-0.5 bg-primary" />{eyebrow}</p>
        <h1 className="text-3xl md:text-5xl font-medium leading-tight max-w-3xl mb-6" style={H}>{title}</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed mb-14">{intro}</p>
        {children}
        {showBookingCta && <div className="mt-20 border-t border-border py-8 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-medium mb-2" style={H}>Pronto para deixar seu carro impecável?</h2>
            <p className="text-sm text-muted-foreground">Escolha o serviço e o horário em menos de um minuto.</p>
          </div>
          <Link to="/servicos" className="inline-flex items-center gap-3 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold hover:bg-primary-hover transition self-start">Agendar serviço <ArrowRight className="w-4 h-4" /></Link>
        </div>}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row justify-between gap-3 text-xs text-footer-muted">
          <span>© 2026 DetailPro. Todos os direitos reservados.</span>
          <Link to="/" className="hover:text-primary">Voltar ao início</Link>
        </div>
      </footer>
    </div>
  );
}

const card = "rounded-2xl border border-border bg-card p-7 transition hover:border-card-hover-border";
const icon = "w-12 h-12 rounded-full border border-primary bg-icon-background text-primary grid place-items-center mb-5";

export function ServicesPage() {
  return (
    <Shell eyebrow="Serviços" title="Cuidado completo, do interior à pintura" intro="Cada serviço é feito por especialistas, com produtos profissionais e atenção a cada detalhe do seu veículo." showBookingCta={false}>
      <div className="grid gap-6 md:grid-cols-2">
        {SERVICES.map((s) => (
          <article key={s.id} id={s.id} className="scroll-mt-24 rounded-2xl border border-border bg-card overflow-hidden transition hover:border-card-hover-border">
            <Link to="/servico/$service" params={{ service: s.id }} aria-label={`Ver ${s.name}`}><img src={s.img} alt={s.name} className="w-full h-52 object-cover" loading="lazy" /></Link>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-3"><s.Icon className="w-5 h-5 text-primary" /><h2 className="text-lg font-semibold">{s.name}</h2></div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{s.text}</p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm"><b className="text-primary">{s.price}</b><span className="text-muted-foreground"> · {s.time}</span></span>
                <Button asChild variant="link"><Link to="/login" search={{ service: s.id }}>Agendar <ArrowRight className="w-4 h-4" /></Link></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function AdvantagesPage() {
  const items = [
    { Icon: Award, t: "Especialistas certificados", d: "Equipe treinada nas melhores técnicas de estética automotiva." },
    { Icon: Leaf, t: "Produtos premium", d: "Linhas profissionais seguras para pintura, couro e plásticos." },
    { Icon: Clock, t: "Pontualidade", d: "Seu carro pronto no horário combinado, sem surpresas." },
    { Icon: BadgeCheck, t: "Garantia de qualidade", d: "Se algo não ficar perfeito, refazemos sem custo." },
    { Icon: Shield, t: "Cuidado total", d: "Ambiente fechado e seguro, com proteção para cada peça." },
    { Icon: Car, t: "Busca e entrega", d: "Buscamos e devolvemos seu carro onde você estiver." },
  ];
  return (
    <Shell eyebrow="Vantagens" title="Por que escolher a DetailPro" intro="Mais do que limpeza: um cuidado que preserva o valor e prolonga a vida útil do seu veículo.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ Icon, t, d }) => <div key={t} className={card}><div className={icon}><Icon className="w-5 h-5" /></div><h2 className="font-semibold mb-2">{t}</h2><p className="text-sm text-muted-foreground leading-relaxed">{d}</p></div>)}
      </div>
    </Shell>
  );
}

export function StepsPage() {
  const steps = [
    { Icon: CalendarCheck, t: "Agendamento", d: "Escolha o serviço, o local e o horário direto pelo site." },
    { Icon: Search, t: "Avaliação", d: "Inspecionamos o veículo e confirmamos o melhor tratamento." },
    { Icon: Wrench, t: "Execução", d: "Nossa equipe realiza o serviço com produtos profissionais." },
    { Icon: Sparkles, t: "Entrega", d: "Você recebe o carro impecável, com orientações de cuidado." },
  ];
  return (
    <Shell eyebrow="Etapas" title="Como funciona o atendimento" intro="Um processo simples e transparente, do agendamento à entrega do seu carro.">
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ Icon, t, d }, i) => (
          <li key={t} className={card}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-full border border-primary text-primary grid place-items-center text-sm font-semibold">0{i + 1}</span>
              <span className="w-10 h-10 rounded-full bg-step-background text-step-foreground grid place-items-center"><Icon className="w-4 h-4" /></span>
            </div>
            <h2 className="font-semibold mb-2">{t}</h2><p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}

export function ReviewsPage() {
  const reviews = [
    { n: "Rafael M.", c: "BMW 320i", t: "O polimento deixou a pintura parecendo de concessionária. Atendimento impecável." },
    { n: "Juliana S.", c: "Jeep Compass", t: "A higienização tirou manchas que eu achava impossíveis. Recomendo demais!" },
    { n: "Carlos A.", c: "Toyota Corolla", t: "Fiz a proteção cerâmica e a água simplesmente escorre. Vale cada centavo." },
    { n: "Fernanda L.", c: "Honda Civic", t: "Pontuais, cuidadosos e muito transparentes no orçamento." },
    { n: "Bruno T.", c: "Audi A4", t: "Buscaram o carro em casa e devolveram brilhando. Serviço de primeira." },
    { n: "Patrícia R.", c: "VW T-Cross", t: "Agendei pelo site em um minuto. Experiência excelente do começo ao fim." },
  ];
  return (
    <Shell eyebrow="Avaliações" title="O que nossos clientes dizem" intro="Nota média 5.0 — a satisfação de quem confia o carro à DetailPro.">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.n} className={card}>
            <div className="flex gap-1 mb-4">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}</div>
            <blockquote className="text-sm leading-relaxed text-soft-foreground mb-5">“{r.t}”</blockquote>
            <figcaption className="text-sm"><b className="font-semibold">{r.n}</b><span className="text-muted-foreground"> · {r.c}</span></figcaption>
          </figure>
        ))}
      </div>
    </Shell>
  );
}

export function ContactPage() {
  const [notice, setNotice] = React.useState("");
  const [errors, setErrors] = React.useState<Partial<Record<"name" | "email" | "message", string>>>({});
  const input = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = contactSchema.safeParse({ name: form.get("name"), email: form.get("email"), message: form.get("message") });
    setNotice("");
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    window.location.href = contactEmailUrl(result.data);
    setNotice("Mensagem preparada. Conclua o envio no seu aplicativo de e-mail.");
  };
  const address = "Antonio Firmino da Silva, 210 - Santa Maria, José Bonifácio, SP";
  const mapQuery = "Av. Antônio Firmino da Silva, 210, Santa Maria, José Bonifácio - SP, 15200-000, Brasil";
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  return (
    <Shell eyebrow="Contato" title="Fale com a gente" intro="Tire dúvidas, peça um orçamento ou siga a DetailPro nas redes sociais.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {[
            { Icon: MapPin, t: "Endereço", d: address, href: mapLink },
            { Icon: Phone, t: "Telefone", d: "+7 999 123-45-67", href: "tel:+79991234567" },
            { Icon: Mail, t: "E-mail", d: "contato@detailpro.com", href: "mailto:contato@detailpro.com" },
            { Icon: Clock, t: "Horário de atendimento", d: "Seg a Sáb, 8h às 18h" },
            { Icon: Instagram, t: "Instagram", d: "Solicitar perfil oficial", href: "mailto:contato@detailpro.com?subject=Perfil%20oficial%20do%20Instagram" },
            { Icon: Send, t: "Telegram", d: "Solicitar contato oficial", href: "mailto:contato@detailpro.com?subject=Contato%20oficial%20do%20Telegram" },
          ].map(({ Icon, t, d, href }) => {
            const body = <><div className="w-11 h-11 rounded-full border border-primary bg-icon-background text-primary grid place-items-center flex-none"><Icon className="w-4 h-4" /></div><div><p className="text-xs text-muted-foreground">{t}</p><p className="text-sm font-semibold">{d}</p></div></>;
            return href ? <a key={t} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${card} !p-5 flex items-center gap-4`}>{body}</a> : <div key={t} className={`${card} !p-5 flex items-center gap-4`}>{body}</div>;
          })}
        </div>
        <form className="space-y-4" onSubmit={submit} noValidate>
              <h2 className="text-lg font-semibold mb-2">Envie uma mensagem</h2>
              <label className="block text-sm">Nome<input name="name" required maxLength={100} placeholder="Seu nome" className={`${input} mt-2`} aria-invalid={Boolean(errors.name)} /></label>
              {errors.name && <p className="text-sm text-primary" role="alert">{errors.name}</p>}
              <label className="block text-sm">E-mail<input name="email" required type="email" maxLength={255} placeholder="Seu e-mail" className={`${input} mt-2`} aria-invalid={Boolean(errors.email)} /></label>
              {errors.email && <p className="text-sm text-primary" role="alert">{errors.email}</p>}
              <label className="block text-sm">Mensagem<textarea name="message" required rows={5} maxLength={1000} placeholder="Como podemos ajudar?" className={`${input} mt-2`} aria-invalid={Boolean(errors.message)} /></label>
              {errors.message && <p className="text-sm text-primary" role="alert">{errors.message}</p>}
              <Button type="submit" className="w-full h-auto rounded-full py-4 hover:bg-primary-hover"><Mail className="w-4 h-4" />Enviar por e-mail</Button>
              {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
        </form>
      </div>
      <div className="mt-10">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <iframe
            title="Localização da DetailPro no Google Maps"
            src={mapEmbed}
            className="w-full h-[320px] md:h-[440px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-t border-border">
            <p className="text-sm text-muted-foreground max-w-xl"><b className="text-foreground font-semibold">Onde estamos:</b> {address}</p>
            <a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition flex-none">Abrir no Google Maps <ArrowRight className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
