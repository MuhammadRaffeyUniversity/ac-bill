"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { JobStatus } from "@/src/generated/prisma/enums";
import { requireRole } from "@/src/lib/auth/guards";
import { db } from "@/src/lib/db";
import { normalizeMalaysianPhone } from "@/src/lib/intake/parse-whatsapp-message";

const saveIntakeSchema = z.object({
  rawText: z.string().trim().min(20),
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  rawPhone: z.string().trim().optional(),
  rawAddress: z.string().trim().min(1, "Service address is required."),
  postcode: z.string().trim().optional(),
  cityOrArea: z.string().trim().optional(),
  state: z.string().trim().optional(),
  requestedAt: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
  unitsCount: z.coerce.number().int().positive("Units must be at least one."),
  serviceType: z.enum(["SERVICE", "INSTALL", "REPAIR"]),
  confidence: z.coerce.number().min(0).max(1).optional(),
  missingFields: z.array(z.string()),
});

function getOptionalDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

export async function saveReviewedIntake(formData: FormData) {
  const session = await requireRole(["DATA_ENTRY"]);
  const missingFieldsValue = formData.get("missingFields")?.toString() ?? "[]";
  let missingFields: string[] = [];

  try {
    missingFields = z.array(z.string()).parse(JSON.parse(missingFieldsValue));
  } catch {
    throw new Error("The review payload is invalid. Parse the message again.");
  }

  const data = saveIntakeSchema.parse({
    rawText: formData.get("rawText"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    rawPhone: formData.get("rawPhone") || undefined,
    rawAddress: formData.get("rawAddress"),
    postcode: formData.get("postcode") || undefined,
    cityOrArea: formData.get("cityOrArea") || undefined,
    state: formData.get("state") || undefined,
    requestedAt: formData.get("requestedAt") || undefined,
    timezone: formData.get("timezone") || undefined,
    unitsCount: formData.get("unitsCount"),
    serviceType: formData.get("serviceType"),
    confidence: formData.get("confidence") || undefined,
    missingFields,
  });

  const job = await db.$transaction(async (transaction) => {
    const customer = await transaction.customer.create({
      data: {
        name: data.customerName,
        phone: data.phone,
        normalizedPhone: normalizeMalaysianPhone(data.phone),
      },
    });
    const address = await transaction.serviceAddress.create({
      data: {
        customerId: customer.id,
        rawAddress: data.rawAddress,
        postcode: data.postcode,
        area: data.cityOrArea,
        city: data.cityOrArea,
        state: data.state,
      },
    });

    return transaction.job.create({
      data: {
        customerId: customer.id,
        addressId: address.id,
        requestedAt: getOptionalDate(data.requestedAt),
        timezone: data.timezone,
        serviceType: data.serviceType,
        unitsCount: data.unitsCount,
        rawWhatsAppText: data.rawText,
        parsedFields: {
          rawPhone: data.rawPhone ?? null,
          postcode: data.postcode ?? null,
          cityOrArea: data.cityOrArea ?? null,
          state: data.state ?? null,
          requestedAt: data.requestedAt ?? null,
          timezone: data.timezone ?? null,
          confidence: data.confidence ?? null,
        },
        missingFields: data.missingFields,
        extractionConfidence: data.confidence,
        statusHistory: {
          create: {
            nextStatus: JobStatus.BOOKED,
            actorId: session.user.id,
            note: "Created from reviewed WhatsApp intake.",
          },
        },
      },
    });
  });

  revalidatePath("/jobs");
  revalidatePath("/dispatch");
  redirect(`/jobs?job=${encodeURIComponent(job.id)}`);
}
