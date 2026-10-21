import { describe, expect, it } from "vitest";
import { staffBookingSchema } from "@/features/detailpro/staff-booking";
describe("Walk-in scheduling", () => {
  const input = { service: "c4f87300-432b-400a-923d-a3c8d4a84092", date: "2026-10-22", time: "08:00", location: "Unidade Centro", name: "Cliente presencial" };
  it("permits a customer with no account or email", () => {
    expect(staffBookingSchema.parse(input).name).toBe("Cliente presencial");
  });
  it("rejects a booking without the customer name", () => {
    expect(staffBookingSchema.safeParse({ ...input, name: "" }).success).toBe(false);
  });
  it("rejects times outside the existing appointment slots", () => {
    expect(staffBookingSchema.safeParse({ ...input, time: "23:00" }).success).toBe(false);
  });
  it("never accepts a price supplied by staff", () => {
    expect(staffBookingSchema.parse({ ...input, price: 1 })).not.toHaveProperty("price");
  });
});