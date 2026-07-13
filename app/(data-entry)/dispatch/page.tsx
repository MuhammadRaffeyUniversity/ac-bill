import { redirect } from "next/navigation";

export default function LegacyDispatchPage() {
  redirect("/jobs?view=assignment");
}
