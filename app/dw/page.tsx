import { redirect } from "next/navigation";

export default function LegacyDwRedirect() {
  redirect("/download");
}
