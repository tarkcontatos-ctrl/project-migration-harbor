import { createFileRoute } from "@tanstack/react-router";
import { StaffDashboard } from "@/features/detailpro/staff-dashboard";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Painel financeiro — DetailPro" },
      { name: "description", content: "Livro-caixa e agendamentos da DetailPro. Acesso restrito à equipe." },
      { property: "og:title", content: "Painel financeiro — DetailPro" },
      { property: "og:description", content: "Livro-caixa e agendamentos da DetailPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return <StaffDashboard view="finance" />;
}
