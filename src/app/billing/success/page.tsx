import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { BillingSuccessClient } from "@/components/BillingSuccessClient";
import { BillingReturnShell } from "@/components/BillingReturnShell";

export const metadata: Metadata = { title: "Confirm payment | CallBlick" };

export default function BillingSuccessPage() {
  return <Suspense fallback={<BillingReturnShell icon={Loader2} tone="info" eyebrow="Secure verification" title="Loading payment confirmation" description="Preparing the secure Stripe return flow…" />}><BillingSuccessClient /></Suspense>;
}
