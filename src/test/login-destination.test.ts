import { describe, expect, it } from "vitest";
import { loginDestination } from "@/features/detailpro/login-destination";

describe("Post-login destination", () => {
  it("opens the financial panel for a financial account even with the default client role", () => {
    expect(loginDestination(["cliente", "financeiro"])).toBe("/financeiro");
  });
  it("opens the staff panel for employees", () => {
    expect(loginDestination(["funcionario"])).toBe("/financeiro");
  });
  it("keeps client accounts in booking", () => {
    expect(loginDestination(["cliente"])).toBe("booking");
  });
});