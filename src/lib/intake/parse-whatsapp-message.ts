import { whatsappExtractionSchema, type WhatsAppExtraction } from "./schema";

const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "requestedAt",
    "timezone",
    "customerName",
    "phone",
    "rawPhone",
    "rawAddress",
    "postcode",
    "cityOrArea",
    "state",
    "unitsCount",
    "serviceType",
    "missingFields",
    "confidence",
  ],
  properties: {
    requestedAt: { anyOf: [{ type: "string" }, { type: "null" }] },
    timezone: { anyOf: [{ type: "string" }, { type: "null" }] },
    customerName: { anyOf: [{ type: "string" }, { type: "null" }] },
    phone: { anyOf: [{ type: "string" }, { type: "null" }] },
    rawPhone: { anyOf: [{ type: "string" }, { type: "null" }] },
    rawAddress: { anyOf: [{ type: "string" }, { type: "null" }] },
    postcode: { anyOf: [{ type: "string" }, { type: "null" }] },
    cityOrArea: { anyOf: [{ type: "string" }, { type: "null" }] },
    state: { anyOf: [{ type: "string" }, { type: "null" }] },
    unitsCount: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
    serviceType: { anyOf: [{ type: "string", enum: ["SERVICE", "INSTALL", "REPAIR"] }, { type: "null" }] },
    missingFields: { type: "array", items: { type: "string" } },
    confidence: { anyOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
  },
} as const;

const requiredFieldNames = ["customerName", "phone", "rawAddress", "unitsCount", "serviceType"] as const;

export function normalizeMalaysianPhone(value: string | null) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("60")) return `+${digits}`;
  if (digits.startsWith("0")) return `+60${digits.slice(1)}`;

  return value.trim();
}

export function normalizeWhatsAppExtraction(input: unknown): WhatsAppExtraction {
  const extraction = whatsappExtractionSchema.parse(input);
  const normalizedPhone = normalizeMalaysianPhone(extraction.phone);
  const missingFields = new Set(extraction.missingFields);
  const normalized = { ...extraction, phone: normalizedPhone || null };

  for (const field of requiredFieldNames) {
    if (!normalized[field]) {
      missingFields.add(field);
    }
  }

  if (!normalized.postcode) {
    missingFields.add("postcode");
  }

  return { ...normalized, missingFields: [...missingFields] };
}

export async function parseWhatsAppMessage(rawText: string) {
  const { env } = await import("../env");

  if (!env.XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured.");
  }

  const response = await fetch(`${env.XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.XAI_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "Extract AC service booking details from the raw WhatsApp message. Do not infer or calculate any price, payment, commission, or job completion. Return null for information that is absent or uncertain.",
        },
        { role: "user", content: rawText },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ac_whatsapp_job_extraction",
          strict: true,
          schema: extractionJsonSchema,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Grok could not parse this message. Please try again.");
  }

  const completion = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Grok did not return an extraction.");
  }

  return normalizeWhatsAppExtraction(JSON.parse(content));
}
