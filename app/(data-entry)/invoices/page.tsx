import { redirect } from "next/navigation";

export default function LegacyInvoicesPage() {
  redirect("/jobs?view=invoice");
}
