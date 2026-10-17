import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "@/features/detailpro/pages";
import { getService } from "@/features/detailpro/services";

export const Route = createFileRoute("/servico/$service")({
  loader: ({ params }) => {
    const service = getService(params.service);
    if (!service) throw notFound();
    return { id: service.id, name: service.name, text: service.text };
  },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name} — DetailPro` : "Serviço indisponível — DetailPro" },
    { name: "description", content: loaderData?.text ?? "Serviço indisponível." },
    { property: "og:title", content: loaderData ? `${loaderData.name} — DetailPro` : "Serviço indisponível — DetailPro" },
    { property: "og:description", content: loaderData?.text ?? "Serviço indisponível." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ServicePage,
});

function ServicePage() {
  const data = Route.useLoaderData();
  const service = getService(data.id);
  if (!service) return null;
  return <Shell eyebrow="Serviço selecionado" title={service.name} intro={service.text} showBookingCta={false}>
    <img src={service.img} alt={service.name} className="w-full max-h-96 aspect-[16/9] object-cover rounded-lg" />
    <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div><p className="text-2xl font-semibold text-primary">{service.price}</p><p className="flex items-center gap-2 text-sm text-muted-foreground mt-3"><Clock className="w-4 h-4" />Duração estimada: {service.time}</p></div>
      <Button asChild className="h-auto rounded-full px-8 py-4 self-start"><Link to="/login" search={{ service: service.id }}>Agendar <ArrowRight /></Link></Button>
    </div>
    <Link to="/servicos" className="inline-block mt-8 text-sm text-muted-foreground hover:text-primary">Ver todos os serviços</Link>
  </Shell>;
}