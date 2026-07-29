import { clerkClient } from "@clerk/nextjs/server";
import { isCurrentUserSuperAdmin } from "@/lib/isSuperAdmin";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/users/[userId]/name">) {
  try {
    const client = await clerkClient();
    // Do not rely on Clerk edge middleware: Amplify serves this Route Handler
    // from a Node Lambda, where the middleware crashes the entire app.
    const authState = (await client.authenticateRequest(request)).toAuth();
    if (!authState?.userId || !(await isCurrentUserSuperAdmin(authState))) {
      return Response.json({ message: "Only super admins can edit user names." }, { status: 403 });
    }

    const { userId } = await context.params;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    if (!firstName || !lastName) {
      return Response.json({ message: "First name and last name are required." }, { status: 422 });
    }

    const user = await client.users.updateUser(userId, { firstName, lastName });
    return Response.json({ id: user.id, firstName: user.firstName, lastName: user.lastName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update user name.";
    return Response.json({ message }, { status: 500 });
  }
}
