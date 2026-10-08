import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export type BillingReturnTone = "success" | "info" | "warning" | "danger";

type Step = {
  label: string;
  state: "complete" | "current" | "upcoming";
};

const toneStyles: Record<BillingReturnTone, { icon: string; glow: string; badge: string }> = {
  success: {
    icon: "border-emerald-300/25 bg-emerald-400/10 text-emerald-300",
    glow: "bg-emerald-400/10",
    badge: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
  },
  info: {
    icon: "border-blue-300/25 bg-blue-400/10 text-[#78BDFF]",
    glow: "bg-blue-400/10",
    badge: "border-blue-300/20 bg-blue-400/10 text-[#B8DAFF]",
  },
  warning: {
    icon: "border-amber-300/25 bg-amber-400/10 text-amber-200",
    glow: "bg-amber-400/10",
    badge: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  },
  danger: {
    icon: "border-rose-300/25 bg-rose-400/10 text-rose-200",
    glow: "bg-rose-400/10",
    badge: "border-rose-300/20 bg-rose-400/10 text-rose-100",
  },
};

export function BillingReturnShell({
  icon: Icon,
  tone,
  eyebrow,
  title,
  description,
  steps,
  children,
  footer,
}: {
  icon: LucideIcon;
  tone: BillingReturnTone;
  eyebrow: string;
  title: string;
  description: string;
  steps?: Step[];
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const styles = toneStyles[tone];

  return <div className="relative h-screen w-full overflow-y-auto bg-[#020912] text-[#F6FAFD]">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-600/15 blur-[120px]" />
      <div className={`absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full ${styles.glow} blur-[130px]`} />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(120,180,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(120,180,255,0.035)_1px,transparent_1px)] [background-size:56px_56px]" />
    </div>

    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" aria-label="CallBlick home"><Image src="/CallBlick-Logo-Final.png" alt="CallBlick" width={138} height={38} priority /></Link>
      <span className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold text-[#AFC9E2]"><LockKeyhole className="h-3.5 w-3.5" /> Secure billing return</span>
    </header>

    <main className="relative z-10 mx-auto flex min-h-[calc(100vh-82px)] w-full max-w-5xl items-center justify-center px-5 py-10 sm:px-8">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-blue-300/15 bg-[#06162c]/88 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/35 to-transparent" />
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${styles.icon}`}><Icon className="h-8 w-8" /></div>
            <span className={`mt-7 w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${styles.badge}`}>{eyebrow}</span>
            <h1 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#AFC9E2] sm:text-base">{description}</p>
            <div className="mt-7">{children}</div>
          </div>

          <aside className="border-t border-blue-300/10 bg-[#041124]/70 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            {steps?.length ? <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7FAED7]">Activation progress</p>
              <ol className="mt-6 space-y-1">{steps.map((step, index) => <li key={step.label} className="relative flex min-h-16 gap-4">
                {index < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-full w-px ${step.state === "complete" ? "bg-emerald-400/40" : "bg-blue-300/12"}`} />}
                <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black ${step.state === "complete" ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200" : step.state === "current" ? "border-blue-300/35 bg-blue-400/15 text-[#B8DAFF] shadow-[0_0_20px_rgba(80,160,255,0.18)]" : "border-blue-300/12 bg-white/[0.025] text-[#6685A2]"}`}>{step.state === "complete" ? "✓" : index + 1}</span>
                <div className="pt-1"><p className={`text-sm font-bold ${step.state === "upcoming" ? "text-[#6685A2]" : "text-[#EAF4FF]"}`}>{step.label}</p><p className="mt-1 text-xs text-[#7896B2]">{step.state === "complete" ? "Complete" : step.state === "current" ? "In progress" : "Waiting"}</p></div>
              </li>)}</ol>
            </div> : <div className="flex h-full flex-col justify-center"><ShieldCheck className="h-8 w-8 text-[#6BB6FF]" /><h2 className="mt-5 text-lg font-black">Your payment details stay with Stripe</h2><p className="mt-3 text-sm leading-6 text-[#8EACC7]">CallBlick receives the purchase status and plan information needed to activate your organization. Card details are never handled by this page.</p></div>}
            <div className="mt-8 border-t border-blue-300/10 pt-6 text-xs leading-5 text-[#7896B2]">{footer || <>You will never be charged again by using a Retry button on this page.</>}</div>
          </aside>
        </div>
      </section>
    </main>
  </div>;
}
