"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "@/lib/useTheme";
import { Sun, Moon } from "lucide-react";

export default function SignInPage() {
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';

  const bg = isLight
    ? 'radial-gradient(ellipse 120% 80% at 50% -10%, #C8DCF5 0%, #EEF3FA 60%)'
    : 'radial-gradient(ellipse 120% 80% at 50% -10%, #03122B 0%, #020912 60%)';

  const overlayBg = isLight
    ? `radial-gradient(ellipse 65% 55% at -5% 30%, rgba(100,160,255,0.18) 0%, transparent 60%),
       radial-gradient(ellipse 55% 60% at 105% 20%, rgba(80,140,220,0.14) 0%, transparent 60%),
       radial-gradient(ellipse 50% 50% at 50% 110%, rgba(60,120,200,0.10) 0%, transparent 55%)`
    : `radial-gradient(ellipse 65% 55% at -5% 30%,  rgba(30,100,255,0.50) 0%, transparent 60%),
       radial-gradient(ellipse 55% 60% at 105% 20%, rgba(20,80,220,0.40)  0%, transparent 60%),
       radial-gradient(ellipse 50% 50% at 50% 110%, rgba(10,60,180,0.35)  0%, transparent 55%),
       radial-gradient(ellipse 40% 35% at 65% -5%,  rgba(50,160,255,0.28) 0%, transparent 55%)`;

  const leftPanelBg = isLight
    ? 'rgba(220,234,252,0.60)'
    : 'rgba(4, 14, 36, 0.38)';
  const leftPanelBorder = isLight
    ? '1px solid rgba(26,111,212,0.12)'
    : '1px solid rgba(255,255,255,0.06)';

  const heroTitle = isLight ? '#0D1B2E' : '#EEF4FF';
  const heroAccent = isLight ? 'rgba(26,111,212,0.90)' : 'rgba(44,143,255,0.90)';
  const heroSubtext = isLight ? 'rgba(20,60,120,0.65)' : 'rgba(180,215,255,0.65)';
  const pillBorder = isLight ? '1px solid rgba(26,111,212,0.25)' : '1px solid rgba(44,143,255,0.25)';
  const pillBg = isLight ? 'rgba(26,111,212,0.10)' : 'rgba(44,143,255,0.10)';
  const pillDot = isLight ? 'rgba(26,111,212,0.9)' : 'rgba(44,143,255,0.9)';
  const pillText = isLight ? 'rgba(20,60,120,0.70)' : 'rgba(180,215,255,0.70)';
  const featurePillBg = isLight ? 'rgba(26,111,212,0.07)' : 'rgba(255,255,255,0.05)';
  const featurePillBorder = isLight ? '1px solid rgba(26,111,212,0.14)' : '1px solid rgba(255,255,255,0.09)';
  const featurePillText = isLight ? 'rgba(20,60,120,0.75)' : 'rgba(200,220,255,0.75)';
  const statValue = isLight ? '#0D1B2E' : '#EEF4FF';
  const statLabel = isLight ? 'rgba(20,60,120,0.45)' : 'rgba(180,215,255,0.45)';
  const statBorder = isLight ? '1px solid rgba(26,111,212,0.12)' : '1px solid rgba(255,255,255,0.07)';

  const rightPanelBg = isLight ? 'rgba(235,243,255,0.60)' : 'transparent';
  const headingColor = isLight ? '#0D1B2E' : '#EEF4FF';
  const subtitleColor = isLight ? 'rgba(20,60,120,0.55)' : 'rgba(180,215,255,0.55)';
  const footerColor = isLight ? 'rgba(20,60,120,0.35)' : 'rgba(180,215,255,0.30)';

  const clerkStyles = isLight ? `
    .cl-rootBox * { color: #0D1B2E; }
    .cl-card {
      background: rgba(255,255,255,0.92) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(26,111,212,0.14) !important;
      box-shadow: 0 8px 40px rgba(26,111,212,0.12), 0 2px 8px rgba(26,111,212,0.06) !important;
      border-radius: 20px !important;
    }
    .cl-headerTitle { color: #0D1B2E !important; font-weight: 800 !important; font-size: 1.15rem !important; letter-spacing: -0.02em !important; }
    .cl-headerSubtitle { color: rgba(20,60,120,0.60) !important; font-size: 0.8rem !important; }
    .cl-socialButtonsBlockButton {
      background: rgba(26,111,212,0.06) !important;
      border: 1px solid rgba(26,111,212,0.16) !important;
      color: #0D1B2E !important;
      border-radius: 12px !important;
    }
    .cl-socialButtonsBlockButton:hover { background: rgba(26,111,212,0.12) !important; border-color: rgba(26,111,212,0.28) !important; }
    .cl-socialButtonsBlockButtonText { color: #0D1B2E !important; font-weight: 600 !important; }
    .cl-dividerLine { background: rgba(26,111,212,0.10) !important; }
    .cl-dividerText { color: rgba(20,60,120,0.40) !important; font-size: 0.68rem !important; letter-spacing: 0.08em !important; }
    .cl-formFieldLabel { color: rgba(20,60,120,0.65) !important; font-weight: 700 !important; font-size: 0.68rem !important; text-transform: uppercase !important; letter-spacing: 0.10em !important; }
    .cl-formFieldInput {
      background: rgba(255,255,255,0.95) !important;
      border: 1px solid rgba(26,111,212,0.18) !important;
      color: #0D1B2E !important;
      border-radius: 11px !important;
      height: 44px !important;
      font-size: 14px !important;
    }
    .cl-formFieldInput:focus { border-color: rgba(26,111,212,0.50) !important; box-shadow: 0 0 0 3px rgba(26,111,212,0.10) !important; outline: none !important; }
    .cl-formFieldInput::placeholder { color: rgba(20,60,120,0.30) !important; }
    .cl-formFieldInputShowPasswordButton { color: rgba(20,60,120,0.45) !important; }
    .cl-formFieldInputShowPasswordButton:hover { color: #0D1B2E !important; }
    .cl-formButtonPrimary {
      background: rgba(26,111,212,0.90) !important;
      border: 1px solid rgba(26,111,212,0.40) !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      font-size: 0.82rem !important;
      letter-spacing: 0.06em !important;
      height: 44px !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 20px rgba(26,111,212,0.25) !important;
    }
    .cl-formButtonPrimary:hover { background: rgba(26,111,212,1) !important; }
    .cl-footer { background: rgba(240,246,255,0.80) !important; border-top: 1px solid rgba(26,111,212,0.08) !important; border-radius: 0 0 20px 20px !important; }
    .cl-footerActionText { color: rgba(20,60,120,0.55) !important; }
    .cl-footerActionLink { color: rgba(26,111,212,0.90) !important; font-weight: 700 !important; }
    .cl-footerActionLink:hover { color: #0D1B2E !important; }
    .cl-footerPages { background: transparent !important; }
    .cl-formFieldErrorText { color: rgba(200,40,40,0.90) !important; font-weight: 600 !important; }
    .cl-alert { background: rgba(255,240,240,0.90) !important; border: 1px solid rgba(200,40,40,0.14) !important; }
    .cl-alertText { color: #0D1B2E !important; }
    .cl-identityPreviewText { color: #0D1B2E !important; }
    .cl-identityPreviewEditButton { color: rgba(26,111,212,0.90) !important; }
  ` : `
    .cl-rootBox * { color: #ffffff; }
    .cl-card {
      background: rgba(6, 18, 48, 0.80) !important;
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

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'stretch', position: 'relative' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: bg, transition: 'background 0.3s ease' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', background: overlayBg, transition: 'background 0.3s ease' }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isLight ? 'rgba(26,111,212,0.10)' : 'rgba(255,255,255,0.08)',
          border: isLight ? '1px solid rgba(26,111,212,0.18)' : '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', transition: 'all 0.15s ease',
          color: isLight ? '#1A6FD4' : '#B3CFE5',
        }}
      >
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      {/* ── Left panel — Branding ── */}
      <div className="hidden lg:flex flex-col justify-between relative z-10 p-14" style={{ width: '52%' }}>
        <div style={{ position: 'absolute', inset: 0, background: leftPanelBg, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderRight: leftPanelBorder, transition: 'all 0.3s ease' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: isLight ? 'linear-gradient(90deg, transparent, rgba(26,111,212,0.18), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <Image
            src={isLight ? '/CallBlick Logo-Dark.png' : '/CallBlick-Logo-Final.png'}
            alt="CallBlick" width={120} height={32}
            className="object-contain" style={{ width: 120, height: 'auto' }}
          />
        </div>

        {/* Hero */}
        <div className="relative space-y-8">
          <div className="space-y-5">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, border: pillBorder, background: pillBg }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pillDot }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: pillText }}>AI-Powered Analysis</span>
            </div>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', color: heroTitle, transition: 'color 0.3s ease' }}>
              Intelligence<br />
              <span style={{ color: heroAccent }}>at every</span><br />
              conversation
            </h1>
          </div>
          <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.7, color: heroSubtext, maxWidth: 340, transition: 'color 0.3s ease' }}>
            Unlock deep insights from your calls with AI-powered transcription, QA scoring, and compliance monitoring.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Real-time Transcription', 'QA Scoring', 'Red Flag Detection', 'Campaign Analytics'].map(f => (
              <span key={f} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: featurePillBg, border: featurePillBorder, color: featurePillText, transition: 'all 0.3s ease' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, paddingTop: 32, borderTop: statBorder }}>
          {[{ value: '99.4%', label: 'Accuracy' }, { value: '24/7', label: 'Uptime' }].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900, color: statValue, letterSpacing: '-0.02em', transition: 'color 0.3s ease' }}>{s.value}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: statLabel, marginTop: 4, transition: 'color 0.3s ease' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div
        className="flex-1 relative z-10 flex flex-col items-center justify-center p-8"
        style={{ minHeight: '100vh', overflowY: 'auto', background: rightPanelBg, transition: 'background 0.3s ease' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <Image src={isLight ? '/CallBlick Logo-Dark.png' : '/CallBlick-Logo-Final.png'} alt="CallBlick" width={120} height={32} className="object-contain" style={{ width: 120, height: 'auto' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: headingColor, letterSpacing: '-0.02em', margin: 0, transition: 'color 0.3s ease' }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: subtitleColor, marginTop: 6, transition: 'color 0.3s ease' }}>Sign in to your account to continue</p>
          </div>

          <style>{clerkStyles}</style>

          <SignIn
            appearance={{
              variables: isLight ? {
                colorPrimary: "rgba(26,111,212,1)",
                colorBackground: "rgba(255,255,255,0.92)",
                colorText: "#0D1B2E",
                colorTextSecondary: "rgba(20,60,120,0.60)",
                colorInputBackground: "rgba(255,255,255,0.95)",
                colorInputText: "#0D1B2E",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#0D1B2E",
                colorDanger: "rgba(200,40,40,0.90)",
                borderRadius: "14px",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                fontSize: "14px",
              } : {
                colorPrimary: "rgba(44,143,255,1)",
                colorBackground: "rgba(6,18,48,0.80)",
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

          <p style={{ textAlign: 'center', fontSize: 11, color: footerColor, marginTop: 20, transition: 'color 0.3s ease' }}>
            Protected by Clerk · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
