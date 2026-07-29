import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 uses the `proxy` convention. Clerk must run for API routes too,
// otherwise server Route Handlers cannot access the active session via auth().
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
