import { NextResponse } from "next/server";

import { submitFeedback } from "@/src/lib/billing/feedback";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please submit valid feedback." }, { status: 400 });
  }
  const result = await submitFeedback({ ...(typeof body === "object" && body ? body : {}), token });
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
