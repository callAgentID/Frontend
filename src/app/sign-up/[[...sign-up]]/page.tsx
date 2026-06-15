"use client";

import Image from "next/image";
import { SignUp } from "@clerk/nextjs";

const CLERK_STYLES = `
  .cl-rootBox * { color: #ffffff; }
  .cl-card {
    background: rgba(6, 18, 48, 0.60) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(255,255,255,0.09) !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07) !important;
    border-radius: 20px !important;
  }
  .cl-headerTitle { color: #EEF4FF !important; font-weight: 800 !important; font-size: 1.15rem !important; letter-spacing: -0.02em !important; }
  .cl-headerSubtitle { color: rgba(180,215,255,0.60) !important; font-size: 0.8rem !important; }
  .cl-socialButtonsBlockButton {
    background: rgba(255,255,255,0.05) !important;
    border: 1px solid rgba(255,255,255,0.10) !important;
    color: #EEF4FF !important;
    border-radius: 12px !important;
  }
  .cl-socialButtonsBlockButton:hover { background: rgba(44,143,255,0.12) !important; border-color: rgba(44,143,255,0.25) !important; }
  .cl-socialButtonsBlockButtonText { color: #EEF4FF !important; font-weight: 600 !important; }
  .cl-dividerLine { background: rgba(255,255,255,0.08) !important; }
  .cl-dividerText { color: rgba(180,215,255,0.45) !important; font-size: 0.68rem !important; letter-spacing: 0.08em !important; }
  .cl-formFieldLabel { color: rgba(180,215,255,0.65) !important; font-weight: 700 !important; font-size: 0.68rem !important; text-transform: uppercase !important; letter-spacing: 0.10em !important; }
  .cl-formFieldInput {
    background: rgba(4,12,32,0.60) !important;
    border: 1px solid rgba(255,255,255,0.10) !important;
    color: #EEF4FF !important;
    border-radius: 11px !important;
    height: 44px !important;
    font-size: 14px !important;
  }
  .cl-formFieldInput:focus { border-color: rgba(44,143,255,0.50) !important; box-shadow: 0 0 0 3px rgba(44,143,255,0.12) !important; outline: none !important; }
  .cl-formFieldInput::placeholder { color: rgba(180,215,255,0.30) !important; }
  .cl-formFieldInputShowPasswordButton { color: rgba(180,215,255,0.50) !important; }
  .cl-formFieldInputShowPasswordButton:hover { color: #EEF4FF !important; }
  .cl-formButtonPrimary {
    background: rgba(44,143,255,0.85) !important;
    border: 1px solid rgba(44,143,255,0.40) !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.82rem !important;
    letter-spacing: 0.06em !important;
    height: 44px !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 20px rgba(44,143,255,0.25) !important;
  }
  .cl-formButtonPrimary:hover { background: rgba(44,143,255,1) !important; }
  .cl-footer { background: rgba(4,12,32,0.40) !important; border-top: 1px solid rgba(255,255,255,0.06) !important; border-radius: 0 0 20px 20px !important; }
  .cl-footerActionText { color: rgba(180,215,255,0.55) !important; }
  .cl-footerActionLink { color: rgba(44,143,255,0.90) !important; font-weight: 700 !important; }
  .cl-footerActionLink:hover { color: #EEF4FF !important; }
  .cl-footerPages { background: transparent !important; }
  .cl-formFieldErrorText { color: rgba(255,120,120,0.90) !important; font-weight: 600 !important; }
  .cl-alert { background: rgba(4,12,32,0.60) !important; border: 1px solid rgba(255,255,255,0.09) !important; }
  .cl-alertText { color: #EEF4FF !important; }
  .cl-identityPreviewText { color: #EEF4FF !important; }
  .cl-identityPreviewEditButton { color: rgba(44,143,255,0.90) !important; }
`;

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'stretch', position: 'relative', overflow: 'hidden' }}>

      {/* ── Water background ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, #03122B 0%, #020912 60%)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 65% 55% at -5% 30%,  rgba(30,100,255,0.50) 0%, transparent 60%),
          radial-gradient(ellipse 55% 60% at 105% 20%, rgba(20,80,220,0.40)  0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 50% 110%, rgba(10,60,180,0.35)  0%, transparent 55%),
          radial-gradient(ellipse 40% 35% at 65% -5%,  rgba(50,160,255,0.28) 0%, transparent 55%)
        `,
      }} />

      {/* ── Left panel — Branding ── */}
      <div className="hidden lg:flex flex-col justify-between relative z-10 p-14" style={{ width: '52%' }}>

        {/* Glass panel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(4, 14, 36, 0.38)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image src="/CallBlick-Logo-Final.png" alt="CallBlick" width={120} height={32} className="object-contain" style={{ width: 120, height: 'auto' }} />
        </div>

        {/* Hero */}
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, border: '1px solid rgba(44,143,255,0.25)', background: 'rgba(44,143,255,0.10)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(44,143,255,0.9)' }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(180,215,255,0.70)' }}>Get Started Free</span>
            </div>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', color: '#EEF4FF' }}>
              Start analysing<br />
              <span style={{ color: 'rgba(44,143,255,0.90)' }}>smarter</span><br />
              today
            </h1>
          </div>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.7, color: 'rgba(180,215,255,0.65)', maxWidth: 340 }}>
            Create your account and start turning raw call recordings into actionable intelligence in minutes.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up in under a minute' },
              { step: '02', title: 'Upload your first call', desc: 'Audio or transcript — both supported' },
              { step: '03', title: 'Get instant insights', desc: 'AI scores, red flags & summaries' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(44,143,255,0.70)', flexShrink: 0, marginTop: 2, letterSpacing: '0.04em' }}>{s.step}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF', margin: 0 }}>{s.title}</p>
                  <p style={{ fontSize: 11, color: 'rgba(180,215,255,0.45)', marginTop: 3 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { value: '99.4%', label: 'Accuracy' },
            { value: '24/7', label: 'Uptime' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EEF4FF', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(180,215,255,0.45)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8 overflow-y-auto" style={{ minHeight: '100vh' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <Image src="/CallBlick-Logo.png" alt="CallBlick" width={36} height={36} className="object-contain" style={{ width: 36, height: 'auto' }} />
          <Image src="/CallBlick-Logo-Text.png" alt="CallBlick" width={110} height={30} className="object-contain" style={{ width: 110, height: 'auto' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.02em', margin: 0 }}>Create your account</h2>
            <p style={{ fontSize: 13, color: 'rgba(180,215,255,0.55)', marginTop: 6 }}>Start your intelligence journey today</p>
          </div>

          <style>{CLERK_STYLES}</style>

          <SignUp
            appearance={{
              variables: {
                colorPrimary: "rgba(44,143,255,1)",
                colorBackground: "rgba(6,18,48,0.60)",
                colorText: "#EEF4FF",
                colorTextSecondary: "rgba(180,215,255,0.60)",
                colorInputBackground: "rgba(4,12,32,0.60)",
                colorInputText: "#EEF4FF",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#EEF4FF",
                colorDanger: "rgba(255,120,120,0.90)",
                borderRadius: "14px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                fontSize: "14px",
              },
            }}
          />

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(180,215,255,0.30)', marginTop: 20 }}>
            Protected by Clerk · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
