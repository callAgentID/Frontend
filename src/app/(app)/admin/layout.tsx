import { requireAppRole } from "@/lib/serverAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole(["admin", "manager"]);
  return children;
}
