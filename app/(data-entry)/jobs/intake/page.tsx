import { redirect } from "next/navigation";

export default function LegacyIntakePage() {
  redirect("/jobs?mode=new");
}
