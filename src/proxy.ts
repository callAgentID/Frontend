import { clerkMiddleware } from "@clerk/nextjs/server";

// Minimal proxy — only initializes Clerk's auth context so auth() works
// in Server Components. No auth.protect() to avoid crashes.
const handler = clerkMiddleware(() => {});

export { handler as proxy };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
