import { ClipboardPasteIcon } from "lucide-react";

import { IntakeWorkspace } from "@/components/intake/intake-workspace";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/src/lib/auth/guards";

export default async function IntakePage() {
  await requireRole(["DATA_ENTRY"]);

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-6 text-foreground md:px-8 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><ClipboardPasteIcon className="size-5" /></div>
            <h1 className="text-2xl font-semibold">Create job from WhatsApp</h1>
            <p className="mt-1 text-sm text-muted-foreground">Extract booking details with Grok, check the result, then save the reviewed job.</p>
          </div>
          <Badge variant="outline">Human review required</Badge>
        </header>
        <IntakeWorkspace />
      </div>
    </main>
  );
}
