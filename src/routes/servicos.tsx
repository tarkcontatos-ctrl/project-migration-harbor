import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/detailpro/pages";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — DetailPro" },
      { name: "description", content: "Lavagem, higienização, polimento e proteção cerâmica com preços e prazos." },
      { property: "og:title", content: "Serviços — DetailPro" },
      { property: "og:description", content: "Lavagem, higienização, polimento e proteção cerâmica com preços e prazos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServicesPage,
});
