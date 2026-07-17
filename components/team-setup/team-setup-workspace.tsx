"use client";

import { useActionState } from "react";
import { Building2Icon, MapPinnedIcon, PlusIcon, UsersRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import { createTeam, type TeamSetupActionState } from "@/src/lib/team-setup/actions";

const initialTeamSetupActionState: TeamSetupActionState = {};
import { canCreateTeam } from "@/src/lib/team-setup/schema";

type Team = {
  id: string;
  name: string;
  region: string | null;
  compensationType: "SALARY" | "COMMISSION";
  serviceAreaTags: string[];
  members: Array<{ id: string; name: string }>;
};

export function TeamSetupWorkspace({ teams }: { teams: Team[] }) {
  const [state, formAction, isPending] = useActionState(createTeam, initialTeamSetupActionState);
  const salaryTeams = teams.filter((team) => team.compensationType === "SALARY");
  const commissionTeams = teams.filter((team) => team.compensationType === "COMMISSION");
  const canAddSalary = canCreateTeam();
  const canAddCommission = canCreateTeam();

  return (
    <div className="grid gap-6" data-motion="list">
      <header className="border-b border-border pb-6" data-motion="item">
        <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><UsersRoundIcon className="size-5" /></div>
        <h1 className="text-2xl font-semibold">Team setup</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Review active teams and add more whenever operations expand. These records power dispatch suggestions and WhatsApp update ownership.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2" data-motion="item">
        <TeamGroup title="Salary teams" count={salaryTeams.length} teams={salaryTeams} />
        <TeamGroup title="Commission teams" count={commissionTeams.length} teams={commissionTeams} />
      </section>

      <Card data-motion="item">
        <CardHeader className="border-b">
          <CardTitle>Add active team</CardTitle>
          <CardDescription>Data Entry can add salary or commission teams as needed. Use the final confirmed business name; rates and sender details remain configuration records.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <form action={formAction} className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="name">Team name</label>
              <Input id="name" name="name" required maxLength={100} placeholder="Confirmed team name" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="region">Region <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Input id="region" name="region" maxLength={100} placeholder="Johor, Melaka, Nilai..." />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="compensationType">Compensation</label>
              <FormSelect id="compensationType" name="compensationType" defaultValue={canAddSalary ? "SALARY" : "COMMISSION"} placeholder="Select compensation type">
                <SelectItem value="SALARY" disabled={!canAddSalary}>Salary</SelectItem>
                <SelectItem value="COMMISSION" disabled={!canAddCommission}>Commission</SelectItem>
              </FormSelect>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="serviceAreaTags">Service areas <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Input id="serviceAreaTags" name="serviceAreaTags" maxLength={500} placeholder="Pasir Gudang, Johor Bahru" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="memberOneName">First member</label>
              <Input id="memberOneName" name="memberOneName" required maxLength={100} placeholder="First team member" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="memberTwoName">Second member</label>
              <Input id="memberTwoName" name="memberTwoName" required maxLength={100} placeholder="Second team member" />
            </div>
            {state.error ? <p role="alert" className="md:col-span-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
            {state.success ? <p role="status" className="md:col-span-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300">{state.success}</p> : null}
            <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={isPending || (!canAddSalary && !canAddCommission)}><PlusIcon />{isPending ? "Adding team..." : "Add team"}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamGroup({ title, count, teams }: { title: string; count: number; teams: Team[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div><CardTitle className="text-base">{title}</CardTitle><CardDescription className="mt-1">{count} active</CardDescription></div>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        {teams.length ? teams.map((team) => <TeamRow key={team.id} team={team} />) : <p className="py-3 text-sm text-muted-foreground">None configured yet.</p>}
      </CardContent>
    </Card>
  );
}

function TeamRow({ team }: { team: Team }) {
  return <div className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0"><p className="font-medium">{team.name}</p><p className="text-xs text-muted-foreground">{team.members.length ? team.members.map(({ name }) => name).join(" & ") : "Member setup required"}</p>{team.region ? <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPinnedIcon className="size-3.5" />{team.region}</p> : null}{team.serviceAreaTags.length ? <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2Icon className="size-3.5" />{team.serviceAreaTags.join(", ")}</p> : null}</div>;
}
