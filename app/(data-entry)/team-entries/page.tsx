import { redirect } from "next/navigation";

export default function LegacyTeamEntriesPage() {
  redirect("/jobs?view=team-report");
}
