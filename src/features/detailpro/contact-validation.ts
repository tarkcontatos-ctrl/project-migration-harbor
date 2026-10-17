import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(100, "Use até 100 caracteres no nome."),
  email: z.string().trim().email("Informe um e-mail válido.").max(255, "Use até 255 caracteres no e-mail."),
  message: z.string().trim().min(1, "Escreva sua mensagem.").max(1000, "Use até 1.000 caracteres na mensagem."),
});

export function contactEmailUrl(values: z.infer<typeof contactSchema>) {
  const data = contactSchema.parse(values);
  const subject = encodeURIComponent(`Contato DetailPro — ${data.name}`);
  const body = encodeURIComponent(`Nome: ${data.name}\nE-mail: ${data.email}\n\n${data.message}`);
  return `mailto:contato@detailpro.com?subject=${subject}&body=${body}`;
}