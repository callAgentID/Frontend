import { clerkMiddleware } from "@clerk/nextjs/server";

// Initialize Clerk request context for Server Components without protecting
// every request in Amplify's Lambda runtime.
const handler = clerkMiddleware(() => {});

export { handler as proxy };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
