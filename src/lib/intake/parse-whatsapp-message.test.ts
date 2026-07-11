import { describe, expect, it } from "vitest";

import { createOpenAiIntakeRequest, createTimeoutSignal, describeOpenAiError, normalizeWhatsAppExtraction } from "./parse-whatsapp-message";

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

describe("createTimeoutSignal", () => {
  it("aborts an external parsing request after the configured timeout", async () => {
    const signal = createTimeoutSignal(1);

    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(signal.aborted).toBe(true);
  });
});

describe("createOpenAiIntakeRequest", () => {
  it("uses the configured OpenAI model and strict structured output", () => {
    const request = createOpenAiIntakeRequest({
      rawText: "Name: Tiruppathi\nService: service",
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-5.6-luna",
    });

    expect(request.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(JSON.parse(request.init.body as string)).toMatchObject({
      model: "gpt-5.6-luna",
      response_format: { type: "json_schema", json_schema: { strict: true } },
    });
    expect(JSON.parse(request.init.body as string)).not.toHaveProperty("temperature");
  });
});

describe("describeOpenAiError", () => {
  it("preserves OpenAI's safe public error message and status", () => {
    expect(describeOpenAiError(400, { error: { message: "Unsupported parameter: temperature" } })).toBe(
      "OpenAI request failed (400): Unsupported parameter: temperature",
    );
  });
});
