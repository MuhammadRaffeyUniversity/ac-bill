import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react";

import { signInWithCredentials } from "@/app/signin/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SignInPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? "/";
  const hasError = params?.error === "CredentialsSignin";

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-8 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheckIcon />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">AC Bill</p>
              <p className="text-xs text-muted-foreground">Staff access</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your internal staff account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signInWithCredentials} className="grid gap-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              {hasError ? (
                <Badge variant="destructive" className="justify-start">
                  Email or password is incorrect.
                </Badge>
              ) : null}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Email</span>
                <Input name="email" type="email" autoComplete="email" required />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Password</span>
                <Input name="password" type="password" autoComplete="current-password" required />
              </label>

              <Button type="submit">
                <KeyRoundIcon data-icon="inline-start" />
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
