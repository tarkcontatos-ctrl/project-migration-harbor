import { describe, expect, it } from "vitest";
import { bookingSearch, getService, SERVICES } from "@/features/detailpro/services";

describe("Service booking selection", () => {
  it("keeps a specific service selected for the calendar", () => {
    const search = bookingSearch({ service: "ceramica" });
    expect(getService(search.service)?.name).toBe("Proteção cerâmica");
    expect(getService(search.service)).toBe(SERVICES[3]);
  });
  it("leaves generic booking without a selected service", () => {
    expect(bookingSearch({}).service).toBeUndefined();
  });
  it("rejects unknown services and ignores prices supplied in the URL", () => {
    expect(getService("<script>lavagem</script>")).toBeUndefined();
    expect(bookingSearch({ service: "lavagem", price: 1 })).toEqual({ service: "lavagem" });
    expect(getService("lavagem")?.price).toBe(SERVICES[0].price);
  });
});