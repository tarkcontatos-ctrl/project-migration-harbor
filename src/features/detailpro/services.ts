import { z } from "zod";
import { Droplets, Armchair, Sparkles, Shield } from "lucide-react";
import complete_wash from "@/assets/complete-wash-4k.webp";
import interior_cleaning from "@/assets/interior-cleaning-4k.webp";
import body_polishing from "@/assets/body-polishing-4k.webp";
import ceramic_coating from "@/assets/ceramic-coating-4k.webp";

export const SERVICES = [
  { id: "lavagem", img: complete_wash, Icon: Droplets, name: "Lavagem completa", price: "a partir de R$ 120", time: "1h30", text: "Lavagem técnica com espuma ativa, descontaminação de rodas e secagem com microfibra sem riscos." },
  { id: "higienizacao", img: interior_cleaning, Icon: Armchair, name: "Higienização interna", price: "a partir de R$ 280", time: "4h", text: "Limpeza profunda de bancos, carpetes e teto, hidratação de couro e eliminação de odores." },
  { id: "polimento", img: body_polishing, Icon: Sparkles, name: "Polimento de carroceria", price: "a partir de R$ 650", time: "1 dia", text: "Correção de riscos e marcas, recuperando o brilho e a profundidade da pintura original." },
  { id: "ceramica", img: ceramic_coating, Icon: Shield, name: "Proteção cerâmica", price: "a partir de R$ 1.400", time: "2 dias", text: "Camada cerâmica que repele água e sujeira, protegendo a pintura por até 3 anos." },
] as const;

export type Service = typeof SERVICES[number];
export function getService(id: unknown) {
  const result = z.enum(["lavagem", "higienizacao", "polimento", "ceramica"]).safeParse(id);
  return result.success ? SERVICES.find((service) => service.id === result.data) : undefined;
}
export function bookingSearch(input: Record<string, unknown>) {
  return { service: getService(input['service'])?.id };
}