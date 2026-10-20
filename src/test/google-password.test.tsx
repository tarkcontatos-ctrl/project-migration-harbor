import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { firstPasswordInput } from "@/features/detailpro/google-password";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), save: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser, signOut: vi.fn() }, rpc: mocks.rpc } }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.save }));
vi.mock("@/lib/google-password.functions", () => ({ saveFirstGooglePassword: vi.fn() }));
import { GooglePasswordGate } from "@/components/ui/google-password-gate";

describe("Google first-password onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
    mocks.save.mockResolvedValue({ ok: true });
  });
  it("requires a new Google account to save a password before entering", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    render(<GooglePasswordGate revision={0}><p>Agendamento disponível</p></GooglePasswordGate>);
    await screen.findByRole("heading", { name: "Crie sua senha" });
    expect(screen.queryByText("Agendamento disponível")).toBeNull();
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Example!94" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Example!94" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar senha e continuar" }));
    await screen.findByText("Agendamento disponível");
    expect(mocks.save).toHaveBeenCalledWith({ data: { password: "Example!94", confirmation: "Example!94" } });
  });
  it("lets existing accounts enter without requesting a password", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    render(<GooglePasswordGate revision={0}><p>Conta existente disponível</p></GooglePasswordGate>);
    await screen.findByText("Conta existente disponível");
    expect(screen.queryByLabelText("Nova senha")).toBeNull();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("does not unlock the application when saving fails", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    mocks.save.mockRejectedValue(new Error("Senha recusada"));
    render(<GooglePasswordGate revision={0}><p>Reserva liberada</p></GooglePasswordGate>);
    await screen.findByLabelText("Nova senha");
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "Example!94" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "Example!94" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar senha e continuar" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Senha recusada"));
    expect(screen.queryByText("Reserva liberada")).toBeNull();
  });
  it("rejects passwords that do not match", () => {
    expect(firstPasswordInput.safeParse({ password: "Example!94", confirmation: "Different!94" }).success).toBe(false);
  });
});