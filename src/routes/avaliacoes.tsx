import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/features/detailpro/pages";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações — DetailPro" },
      { name: "description", content: "O que os clientes dizem sobre a DetailPro." },
      { property: "og:title", content: "Avaliações — DetailPro" },
      { property: "og:description", content: "O que os clientes dizem sobre a DetailPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewsPage,
});
