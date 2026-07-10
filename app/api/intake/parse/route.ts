import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hasAnyRole } from "@/src/lib/auth/permissions";
import { parseWhatsAppMessage } from "@/src/lib/intake/parse-whatsapp-message";
import { parseWhatsAppRequestSchema } from "@/src/lib/intake/schema";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to parse a WhatsApp message." }, { status: 401 });
  }

  if (!hasAnyRole(session.user.role, ["DATA_ENTRY"])) {
    return NextResponse.json({ error: "You do not have access to intake." }, { status: 403 });
  }

  const payload = parseWhatsAppRequestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  }

  try {
    const extraction = await parseWhatsAppMessage(payload.data.rawText);
    return NextResponse.json({ extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse this message.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
