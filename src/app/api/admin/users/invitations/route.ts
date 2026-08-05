import { clerkClient } from "@clerk/nextjs/server";
import { isCurrentUserSuperAdmin } from "@/lib/isSuperAdmin";

export async function POST(request: Request) {
  try {
    const client = await clerkClient();
    // Amplify cannot run Clerk's edge proxy. Authenticate this individual
    // Node route directly from the signed Clerk cookie/token instead.
    const authState = (await client.authenticateRequest(request)).toAuth();
    if (!authState?.userId || !(await isCurrentUserSuperAdmin(authState))) {
      return Response.json({ message: "Only super admins can invite users." }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const emailAddress = typeof body?.email === "string" ? body.email.trim() : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    if (!emailAddress || !/^\S+@\S+\.\S+$/.test(emailAddress) || !firstName || !lastName) {
      return Response.json({ message: "Email, first name, and last name are required." }, { status: 422 });
    }

    // Clerk sends the recipient to this URL after they accept. A relative URL
    // makes Clerk use its hosted domain (which has no `/sign-up` page here),
    // so preserve the actual CallBlick origin from the incoming request.


    const redirectUrl = "https://app.callblick.com"

    await client.invitations.createInvitation({
      emailAddress,
      redirectUrl,
      // Application invitation metadata is applied to the created user.
      // The sign-up flow collects the actual Clerk profile name on acceptance.
      publicMetadata: { invited_first_name: firstName, invited_last_name: lastName },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send invitation.";
    return Response.json({ message }, { status: 500 });
  }
}
