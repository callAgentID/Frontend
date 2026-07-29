import type { AuthObject } from "@clerk/backend";

/**
 * User administration is already restricted to platform super-admins in the
 * UI. Server-side, require an admin membership in the active organization.
 */
export async function isCurrentUserSuperAdmin(authState: AuthObject) {
  const orgRole = "orgRole" in authState ? authState.orgRole : null;
  return orgRole === "org:admin";
}
