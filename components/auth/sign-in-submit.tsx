"use client";

import { useFormStatus } from "react-dom";
import { KeyRoundIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignInSubmit() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} data-motion="item">
      {pending ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <KeyRoundIcon data-icon="inline-start" />}
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
