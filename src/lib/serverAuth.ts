import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type AppRole = "admin" | "manager" | "user";

function normalizeRole(role?: string | null) {
  return role?.toLowerCase().replace(/^org:/, "") ?? null;
}

export async function requireAppRole(allowedRoles: AppRole[]) {
  const authState = await auth.protect();
  const organizationRole = normalizeRole(authState.orgRole);

  if (organizationRole && allowedRoles.includes(organizationRole as AppRole)) {
    return;
  }

  const user = await currentUser();
  const profileRole = normalizeRole(user?.publicMetadata?.role as string | undefined);

  if (profileRole === "super_admin" || (profileRole && allowedRoles.includes(profileRole as AppRole))) {
    return;
  }

  redirect("/");
}
