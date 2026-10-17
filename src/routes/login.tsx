import { createFileRoute } from "@tanstack/react-router";
import { SignIn1 } from "@/components/ui/modern-stunning-sign-in";
import { bookingSearch } from "@/features/detailpro/services";

export const Route = createFileRoute("/login")({
  validateSearch: bookingSearch,
  head: () => ({
    meta: [
      { title: "Entrar — DetailPro" },
      { name: "description", content: "Entre na sua conta DetailPro para concluir o agendamento do seu serviço." },
      { property: "og:title", content: "Entrar — DetailPro" },
      { property: "og:description", content: "Conclua o agendamento do seu serviço de estética automotiva." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { service } = Route.useSearch();
  return <SignIn1 key={service ?? "all"} serviceId={service} />;
}
