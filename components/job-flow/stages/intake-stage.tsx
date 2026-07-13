import { IntakeWorkspace } from "@/components/intake/intake-workspace";

export function IntakeStage() {
  return <section className="grid gap-4"><div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Stage 1 of 5</p><h2 className="mt-1 text-2xl font-semibold">Create job from WhatsApp</h2><p className="mt-1 text-sm text-muted-foreground">Paste the customer booking, review the extraction, and continue directly to assignment.</p></div><IntakeWorkspace /></section>;
}
