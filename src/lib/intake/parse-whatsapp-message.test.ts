import { describe, expect, it } from "vitest";

import { normalizeWhatsAppExtraction } from "./parse-whatsapp-message";

describe("normalizeWhatsAppExtraction", () => {
  it("normalizes a Malaysian mobile number and preserves missing required fields", () => {
    const result = normalizeWhatsAppExtraction({
      requestedAt: "2026-07-08T14:00:00+08:00",
      timezone: "Asia/Kuala_Lumpur",
      customerName: "Faridah binti mat taib",
      phone: "+60 19-756 3236",
      rawPhone: "+60 19-756 3236",
      rawAddress: "No 46 jln mawar 56 taman mawar pasir gudang johor",
      postcode: null,
      cityOrArea: "Pasir Gudang",
      state: "Johor",
      unitsCount: 1,
      serviceType: "SERVICE",
      missingFields: [],
      confidence: 0.92,
    });

    expect(result.phone).toBe("+60197563236");
    expect(result.missingFields).toContain("postcode");
  });

  it("marks blank required values for human review", () => {
    const result = normalizeWhatsAppExtraction({
      requestedAt: null,
      timezone: null,
      customerName: "",
      phone: "",
      rawPhone: "",
      rawAddress: "",
      postcode: null,
      cityOrArea: null,
      state: null,
      unitsCount: null,
      serviceType: null,
      missingFields: [],
      confidence: null,
    });

    expect(result.missingFields).toEqual(
      expect.arrayContaining(["customerName", "phone", "rawAddress", "unitsCount", "serviceType"]),
    );
  });
});
