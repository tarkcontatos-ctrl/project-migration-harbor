import { createFileRoute } from "@tanstack/react-router";
import { StaffDashboard } from "@/features/detailpro/staff-dashboard";
export const Route = createFileRoute("/funcionarios")({
  head: () => ({ meta: [
    { title: "Painel dos funcionários — DetailPro" },
    { name: "description", content: "Agenda da equipe DetailPro e atendimento de clientes presenciais." },
    { property: "og:title", content: "Painel dos funcionários — DetailPro" },
    { property: "og:description", content: "Agenda e atendimentos presenciais da equipe DetailPro." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <StaffDashboard view="staff" />,
});