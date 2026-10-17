import { createFileRoute } from "@tanstack/react-router";
import { StepsPage } from "@/features/detailpro/pages";

export const Route = createFileRoute("/etapas")({
  head: () => ({
    meta: [
      { title: "Etapas — DetailPro" },
      { name: "description", content: "Como funciona o atendimento DetailPro, do agendamento à entrega." },
      { property: "og:title", content: "Etapas — DetailPro" },
      { property: "og:description", content: "Como funciona o atendimento DetailPro, do agendamento à entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StepsPage,
});
