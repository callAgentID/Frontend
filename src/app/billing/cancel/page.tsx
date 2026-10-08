import { BillingCancelClient } from "@/components/BillingCancelClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout cancelled | CallBlick" };

export default function BillingCancelPage() {
  return <BillingCancelClient />;
}
