import { requireAppRole } from "@/lib/serverAuth";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  await requireAppRole([]);
  return children;
}
