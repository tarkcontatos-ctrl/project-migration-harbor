import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { firstPasswordInput } from "@/features/detailpro/google-password";

export const saveFirstGooglePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => firstPasswordInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: pending, error: checkError } = await context.supabase.rpc("needs_google_password");
    if (checkError) throw new Error("Não foi possível verificar seu cadastro.");
    if (!pending) throw new Error("Sua conta já possui senha. Use a recuperação de senha para alterá-la.");
    // Only the authenticated owner with an unfinished first-password step can use this endpoint.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (error) throw new Error("Não foi possível salvar essa senha. Escolha outra senha e tente novamente.");
    const { error: completeError } = await supabaseAdmin.from("google_password_setup")
      .update({ completed_at: new Date().toISOString() }).eq("user_id", context.userId);
    if (completeError) throw new Error("Senha salva. Atualize a página para continuar.");
    return { ok: true };
  });