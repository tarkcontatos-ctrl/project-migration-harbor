import { z } from "zod";

export const firstPasswordInput = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(72),
  confirmation: z.string(),
}).refine((value) => value.password === value.confirmation, {
  message: "As senhas não coincidem.", path: ["confirmation"],
});