"use client";

import { useState } from "react";
import { AlertCircleIcon, CheckCircle2Icon, LoaderCircleIcon, SparklesIcon } from "lucide-react";

import { saveReviewedIntake } from "@/src/lib/intake/actions";
import type { WhatsAppExtraction } from "@/src/lib/intake/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const fieldLabels: Record<string, string> = {
  customerName: "Customer name",
  phone: "Phone",
  rawAddress: "Service address",
  unitsCount: "Units",
  serviceType: "Service type",
  postcode: "Postcode",
};

export function IntakeWorkspace() {
  const [rawText, setRawText] = useState("");
  const [extraction, setExtraction] = useState<WhatsAppExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  async function parseMessage() {
    setError(null);
    setExtraction(null);
    setIsParsing(true);

    try {
      const response = await fetch("/api/intake/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const payload = (await response.json()) as { error?: string; extraction?: WhatsAppExtraction };

      if (!response.ok || !payload.extraction) {
        throw new Error(payload.error ?? "Unable to parse this message.");
      }

      setExtraction(payload.extraction);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Unable to parse this message.");
    } finally {
      setIsParsing(false);
    }
  }

  function startManualEntry() {
    setError(null);
    setExtraction({
      requestedAt: null,
      timezone: null,
      customerName: null,
      phone: null,
      rawPhone: null,
      rawAddress: null,
      postcode: null,
      cityOrArea: null,
      state: null,
      unitsCount: null,
      serviceType: null,
      missingFields: ["customerName", "phone", "rawAddress", "unitsCount", "serviceType"],
      confidence: null,
    });
  }

  function updateTextField(field: keyof WhatsAppExtraction, value: string) {
    setExtraction((current) => (current ? { ...current, [field]: value || null } : current));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Paste WhatsApp message</CardTitle>
          <CardDescription>Keep the original message intact. AI extracts booking fields only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Paste the complete customer WhatsApp message here..."
            className="min-h-80 resize-y font-mono text-sm leading-6"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={startManualEntry} disabled={rawText.trim().length < 20 || isParsing}>
              Enter manually
            </Button>
            <Button type="button" onClick={parseMessage} disabled={rawText.trim().length < 20 || isParsing}>
              {isParsing ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
              {isParsing ? "Parsing..." : "Parse booking details"}
            </Button>
          </div>
          {error ? (
            <div className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Review before booking</CardTitle>
          <CardDescription>Edit anything the AI could not confidently determine. No price or payment is created here.</CardDescription>
        </CardHeader>
        <CardContent>
          {extraction ? (
            <form action={saveReviewedIntake} className="grid gap-4">
              <input type="hidden" name="rawText" value={rawText} />
              <input type="hidden" name="missingFields" value={JSON.stringify(extraction.missingFields)} />
              <input type="hidden" name="confidence" value={extraction.confidence ?? ""} />
              <input type="hidden" name="rawPhone" value={extraction.rawPhone ?? ""} />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  <span>Extraction confidence: {extraction.confidence ? `${Math.round(extraction.confidence * 100)}%` : "not available"}</span>
                </div>
                {extraction.missingFields.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {extraction.missingFields.map((field) => (
                      <Badge key={field} variant="outline" className="border-primary/30 bg-primary/10 text-foreground">
                        {fieldLabels[field] ?? field}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer name"><Input name="customerName" required value={extraction.customerName ?? ""} onChange={(event) => updateTextField("customerName", event.target.value)} /></Field>
                <Field label="Phone"><Input name="phone" required value={extraction.phone ?? ""} onChange={(event) => updateTextField("phone", event.target.value)} /></Field>
              </div>
              <Field label="Service address"><Textarea name="rawAddress" required value={extraction.rawAddress ?? ""} onChange={(event) => updateTextField("rawAddress", event.target.value)} className="min-h-24 resize-y" /></Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Postcode"><Input name="postcode" value={extraction.postcode ?? ""} onChange={(event) => updateTextField("postcode", event.target.value)} /></Field>
                <Field label="Area / city"><Input name="cityOrArea" value={extraction.cityOrArea ?? ""} onChange={(event) => updateTextField("cityOrArea", event.target.value)} /></Field>
                <Field label="State"><Input name="state" value={extraction.state ?? ""} onChange={(event) => updateTextField("state", event.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Units"><Input name="unitsCount" type="number" min="1" required value={extraction.unitsCount ?? ""} onChange={(event) => setExtraction((current) => current ? { ...current, unitsCount: Number(event.target.value) || null } : current)} /></Field>
                <Field label="Service type">
                  <Select name="serviceType" required value={extraction.serviceType} onValueChange={(value) => setExtraction((current) => current ? { ...current, serviceType: value as WhatsAppExtraction["serviceType"] } : current)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Service</SelectItem>
                      <SelectItem value="INSTALL">Install</SelectItem>
                      <SelectItem value="REPAIR">Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <details className="text-sm text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">Timing details</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Requested at"><Input name="requestedAt" value={extraction.requestedAt ?? ""} onChange={(event) => updateTextField("requestedAt", event.target.value)} /></Field><Field label="Timezone"><Input name="timezone" value={extraction.timezone ?? ""} onChange={(event) => updateTextField("timezone", event.target.value)} /></Field></div></details>
              <Button type="submit" className="w-full sm:w-auto">Save reviewed job as booked</Button>
            </form>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>Parsed booking fields will appear here for your review.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
