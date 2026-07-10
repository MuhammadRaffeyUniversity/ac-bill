import { z } from "zod";

const nullableText = z.string().trim().nullable();

export const whatsappExtractionSchema = z.object({
  requestedAt: nullableText,
  timezone: nullableText,
  customerName: nullableText,
  phone: nullableText,
  rawPhone: nullableText,
  rawAddress: nullableText,
  postcode: nullableText,
  cityOrArea: nullableText,
  state: nullableText,
  unitsCount: z.number().int().positive().nullable(),
  serviceType: z.enum(["SERVICE", "INSTALL", "REPAIR"]).nullable(),
  missingFields: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).nullable(),
});

export const parseWhatsAppRequestSchema = z.object({
  rawText: z.string().trim().min(20, "Paste the full WhatsApp message before parsing."),
});

export type WhatsAppExtraction = z.infer<typeof whatsappExtractionSchema>;
