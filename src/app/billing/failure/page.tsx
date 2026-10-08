import { BillingFailureClient } from "@/components/BillingFailureClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment issue | CallBlick" };

export default function BillingFailurePage() {
  return <BillingFailureClient />;
}
