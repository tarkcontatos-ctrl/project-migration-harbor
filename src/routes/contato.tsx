import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/features/detailpro/pages";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — DetailPro" },
      { name: "description", content: "Telefone, e-mail, redes sociais e formulário de contato da DetailPro." },
      { property: "og:title", content: "Contato — DetailPro" },
      { property: "og:description", content: "Telefone, e-mail, redes sociais e formulário de contato da DetailPro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});
