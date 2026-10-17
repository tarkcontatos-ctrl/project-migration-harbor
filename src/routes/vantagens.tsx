import { createFileRoute } from "@tanstack/react-router";
import { AdvantagesPage } from "@/features/detailpro/pages";

export const Route = createFileRoute("/vantagens")({
  head: () => ({
    meta: [
      { title: "Vantagens — DetailPro" },
      { name: "description", content: "Por que escolher a DetailPro para cuidar do seu veículo." },
      { property: "og:title", content: "Vantagens — DetailPro" },
      { property: "og:description", content: "Por que escolher a DetailPro para cuidar do seu veículo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdvantagesPage,
});
