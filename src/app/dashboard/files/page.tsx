import { redirect } from "next/navigation";

// Redirect alte /dashboard/files Route zur neuen /dashboard/uploads Route
export default function FilesPage() {
  redirect("/dashboard/uploads");
}
