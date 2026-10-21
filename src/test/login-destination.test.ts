import { describe, expect, it } from "vitest";
import { loginDestination } from "@/features/detailpro/login-destination";

describe("Post-login destination", () => {
  it("opens the financial panel for a financial account even with the default client role", () => {
    expect(loginDestination(["cliente", "financeiro"])).toBe("/financeiro");
  });
  it("opens the staff panel for employees", () => {
    expect(loginDestination(["funcionario"])).toBe("/funcionarios");
  });
  it("keeps client accounts in booking", () => {
    expect(loginDestination(["cliente"])).toBe("booking");
  });
  it("prefers financial access for accounts with both staff roles", () => {
    expect(loginDestination(["financeiro", "funcionario"])).toBe("/financeiro");
  });
});