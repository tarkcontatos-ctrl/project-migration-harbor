import { describe, expect, it } from "vitest";
import { contactSchema, contactEmailUrl } from "@/features/detailpro/contact-validation";

const valid = { name: "Ana", email: "ana@example.com", message: "Gostaria de um orçamento." };
describe("Contact input validation", () => {
  it("limits names to 100 characters", () => {
    expect(contactSchema.safeParse({ ...valid, name: "a".repeat(100) }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, name: "a".repeat(101) }).success).toBe(false);
  });
  it("rejects email addresses longer than 255 characters", () => {
    expect(contactSchema.safeParse({ ...valid, email: `${"a".repeat(244)}@example.com` }).success).toBe(false);
  });
  it("limits messages to 1000 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(1000) }).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, message: "a".repeat(1001) }).success).toBe(false);
  });
  it("encodes message text without injecting URL parameters", () => {
    const url = new URL(contactEmailUrl({ ...valid, message: "Olá &bcc=other@example.com\n#teste" }));
    expect(url.searchParams.get("bcc")).toBeNull();
    expect(url.searchParams.get("body")).toContain("Olá &bcc=other@example.com\n#teste");
  });
});