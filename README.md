# Conversation Intel

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Configure the public backend and Clerk keys before starting the app:

```env
VITE_API_BASE_URL=https://your-api.example.com/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

The deployment plan uses the `VITE_*` names above. `next.config.ts` maps them to
Next.js public client variables at build time. The equivalent
`NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` names are also
supported and take precedence when both forms are present.

Configure Stripe Checkout on the backend to return to these frontend routes:

```text
organization success_url: https://your-frontend.example.com/billing/success?session_id={CHECKOUT_SESSION_ID}&checkout_scope=organization
public signup success_url: https://your-frontend.example.com/billing/success?session_id={CHECKOUT_SESSION_ID}&checkout_scope=public_signup
cancel_url:                 https://your-frontend.example.com/billing/cancel
```

The scope is used only to choose the return flow. Subscription access still comes
from the verified billing overview, claim response, or Stripe webhook state.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
