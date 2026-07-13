import { clerkMiddleware } from "@clerk/nextjs/server";

const FALLBACK_API_URL = "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";

function getApiOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL || FALLBACK_API_URL).origin;
  } catch {
    return FALLBACK_API_URL;
  }
}

export default clerkMiddleware({
  contentSecurityPolicy: {
    strict: true,
    directives: {
      "connect-src": [getApiOrigin(), "https://*.amazonaws.com"],
      "media-src": ["self", "blob:", "https://*.amazonaws.com"],
      "object-src": ["none"],
      "base-uri": ["self"],
      "frame-ancestors": ["none"],
    },
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
