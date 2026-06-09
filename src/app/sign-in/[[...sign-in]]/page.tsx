"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#0A1931', color: '#ffffff', alignItems: 'stretch' }}>

      {/* ── Left Panel — Branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-14"
        style={{ background: 'linear-gradient(135deg, #0D2137 0%, #1A3D63 60%, #0A1931 100%)' }}>

        {/* Background glow orbs */}
        <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4A7FA7, transparent)' }} />
        <div className="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #B3CFE5, transparent)' }} />
        <div className="absolute top-[40%] right-[10%] w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4A7FA7, transparent)' }} />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(179,207,229,1) 1px, transparent 1px), linear-gradient(90deg, rgba(179,207,229,1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />

        {/* Top — Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #4A7FA7, #1A3D63)' }}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white leading-none">Conversation</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.25em] mt-0.5" style={{ color: '#B3CFE5' }}>Intel Platform</span>
          </div>
        </div>

        {/* Middle — Hero text */}
        <div className="relative space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest"
              style={{ borderColor: 'rgba(74,127,167,0.4)', background: 'rgba(74,127,167,0.15)', color: '#B3CFE5' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4A7FA7' }} />
              AI-Powered Analysis
            </div>
            <h1 className="text-5xl font-[900] leading-[1.08] tracking-tight text-white">
              Intelligence<br />
              <span style={{ color: '#4A7FA7' }}>at every</span><br />
              conversation
            </h1>
          </div>
          <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: 'rgba(179,207,229,0.8)' }}>
            Unlock deep insights from your calls with AI-powered transcription, QA scoring, and compliance monitoring.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Real-time Transcription', 'QA Scoring', 'Red Flag Detection', 'Campaign Analytics'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: 'rgba(74,127,167,0.15)', color: '#B3CFE5', border: '1px solid rgba(74,127,167,0.25)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom — Stats */}
        <div className="relative grid grid-cols-3 gap-6 pt-8 border-t" style={{ borderColor: 'rgba(74,127,167,0.2)' }}>
          {[
            { value: '99.4%', label: 'Transcription Accuracy' },
            { value: '24/7', label: 'Platform Uptime' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-[900] text-white">{s.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'rgba(179,207,229,0.6)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Sign In Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto" style={{ minHeight: '100vh' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4A7FA7, #1A3D63)' }}>
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-lg font-extrabold text-white">Conversation Intel</span>
        </div>

        <div className="w-full max-w-[420px] space-y-6">
          {/* Heading above card */}
          <div className="text-center space-y-1 pb-2">
            <h2 className="text-2xl font-[850] text-white tracking-tight">Welcome back</h2>
            <p className="text-sm font-medium" style={{ color: '#B3CFE5' }}>Sign in to your account to continue</p>
          </div>

          <style>{`
            /* ── Clerk card shell ── */
            .cl-card { background: #162F4A !important; border: 1px solid rgba(74,127,167,0.4) !important; box-shadow: 0 25px 60px rgba(0,0,0,0.5) !important; }
            .cl-headerTitle { color: #ffffff !important; font-weight: 900 !important; font-size: 1.2rem !important; }
            .cl-headerSubtitle { color: #B3CFE5 !important; }

            /* ── Social buttons ── */
            .cl-socialButtonsBlockButton { background: rgba(74,127,167,0.12) !important; border: 1px solid rgba(74,127,167,0.35) !important; color: #ffffff !important; }
            .cl-socialButtonsBlockButton:hover { background: rgba(74,127,167,0.25) !important; }
            .cl-socialButtonsBlockButtonText { color: #ffffff !important; font-weight: 600 !important; }

            /* ── Divider ── */
            .cl-dividerLine { background: rgba(74,127,167,0.3) !important; }
            .cl-dividerText { color: #B3CFE5 !important; font-weight: 700 !important; font-size: 0.7rem !important; letter-spacing: 0.08em !important; }

            /* ── Form labels ── */
            .cl-formFieldLabel { color: #B3CFE5 !important; font-weight: 700 !important; font-size: 0.7rem !important; text-transform: uppercase !important; letter-spacing: 0.08em !important; }

            /* ── Inputs ── */
            .cl-formFieldInput { background: #0D1E30 !important; border: 1px solid rgba(74,127,167,0.4) !important; color: #ffffff !important; border-radius: 10px !important; height: 44px !important; font-size: 14px !important; }
            .cl-formFieldInput:focus { border-color: #4A7FA7 !important; box-shadow: 0 0 0 2px rgba(74,127,167,0.25) !important; outline: none !important; }
            .cl-formFieldInput::placeholder { color: rgba(179,207,229,0.4) !important; }

            /* ── Password show/hide ── */
            .cl-formFieldInputShowPasswordButton { color: #B3CFE5 !important; }
            .cl-formFieldInputShowPasswordButton:hover { color: #ffffff !important; }

            /* ── Primary button ── */
            .cl-formButtonPrimary { background: linear-gradient(135deg, #4A7FA7, #2A5F8A) !important; color: #ffffff !important; font-weight: 700 !important; font-size: 0.85rem !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; height: 44px !important; border-radius: 10px !important; border: none !important; box-shadow: 0 4px 15px rgba(74,127,167,0.35) !important; }
            .cl-formButtonPrimary:hover { opacity: 0.9 !important; }

            /* ── Footer ── */
            .cl-footer { background: rgba(13,30,48,0.6) !important; border-top: 1px solid rgba(74,127,167,0.2) !important; }
            .cl-footerActionText { color: #B3CFE5 !important; }
            .cl-footerActionLink { color: #63B3ED !important; font-weight: 700 !important; }
            .cl-footerActionLink:hover { color: #B3CFE5 !important; }
            .cl-footerPages { background: transparent !important; }

            /* ── Errors & alerts ── */
            .cl-formFieldErrorText { color: #FC6E6E !important; font-weight: 600 !important; }
            .cl-alert { background: #0D1E30 !important; border: 1px solid rgba(74,127,167,0.3) !important; }
            .cl-alertText { color: #ffffff !important; }

            /* ── Identity preview ── */
            .cl-identityPreviewText { color: #ffffff !important; }
            .cl-identityPreviewEditButton { color: #63B3ED !important; }

            /* ── Internal / misc text ── */
            .cl-internal-b3fm6y { color: #B3CFE5 !important; }
            /* Reset inherited pink from root body */
            .cl-rootBox, .cl-rootBox * { color: #ffffff; }
            .cl-card, .cl-card * { color: #ffffff; }
          `}</style>

          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#4A7FA7",
                colorBackground: "#162F4A",
                colorText: "#ffffff",
                colorTextSecondary: "#B3CFE5",
                colorInputBackground: "#0D1E30",
                colorInputText: "#ffffff",
                colorTextOnPrimaryBackground: "#ffffff",
                colorNeutral: "#ffffff",
                colorDanger: "#FC6E6E",
                colorSuccess: "#48C78E",
                borderRadius: "14px",
                fontFamily: "var(--font-geist-sans)",
                fontSize: "14px",
                spacingUnit: "18px",
              },
            }}
          />

          {/* Footer note */}
          <p className="text-center text-xs font-medium pb-4" style={{ color: 'rgba(179,207,229,0.5)' }}>
            Protected by Clerk · End-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
