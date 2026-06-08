"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', minHeight: '100vh', background: '#0A1931', color: '#ffffff' }}>

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
              Get Started Free
            </div>
            <h1 className="text-5xl font-[900] leading-[1.08] tracking-tight text-white">
              Start analysing<br />
              <span style={{ color: '#4A7FA7' }}>smarter</span><br />
              today
            </h1>
          </div>
          <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: 'rgba(179,207,229,0.8)' }}>
            Create your account and start turning raw call recordings into actionable intelligence in minutes.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up in under a minute' },
              { step: '02', title: 'Upload your first call', desc: 'Audio or transcript — both supported' },
              { step: '03', title: 'Get instant insights', desc: 'AI scores, red flags & summaries' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <span className="text-xs font-black shrink-0 mt-0.5" style={{ color: '#4A7FA7' }}>{s.step}</span>
                <div>
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(179,207,229,0.6)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Stats */}
        <div className="relative grid grid-cols-3 gap-6 pt-8 border-t" style={{ borderColor: 'rgba(74,127,167,0.2)' }}>
          {[
            { value: '99.4%', label: 'Transcription Accuracy' },
            { value: '<30s', label: 'Processing Time' },
            { value: '24/7', label: 'Platform Uptime' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-[900] text-white">{s.value}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'rgba(179,207,229,0.6)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel — Sign Up Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">

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
            <h2 className="text-2xl font-[850] text-white tracking-tight">Create your account</h2>
            <p className="text-sm font-medium" style={{ color: '#B3CFE5' }}>Start your intelligence journey today</p>
          </div>

          <style>{`
            .cl-card { background: #162F4A !important; border: 1px solid rgba(74,127,167,0.4) !important; box-shadow: 0 25px 60px rgba(0,0,0,0.5) !important; }
            .cl-headerTitle { color: #ffffff !important; font-weight: 900 !important; font-size: 1.2rem !important; }
            .cl-headerSubtitle { color: #B3CFE5 !important; }
            .cl-socialButtonsBlockButton { background: rgba(74,127,167,0.12) !important; border: 1px solid rgba(74,127,167,0.35) !important; color: #ffffff !important; }
            .cl-socialButtonsBlockButton:hover { background: rgba(74,127,167,0.25) !important; }
            .cl-socialButtonsBlockButtonText { color: #ffffff !important; font-weight: 600 !important; }
            .cl-dividerLine { background: rgba(74,127,167,0.3) !important; }
            .cl-dividerText { color: #B3CFE5 !important; font-weight: 700 !important; font-size: 0.7rem !important; letter-spacing: 0.08em !important; }
            .cl-formFieldLabel { color: #B3CFE5 !important; font-weight: 700 !important; font-size: 0.7rem !important; text-transform: uppercase !important; letter-spacing: 0.08em !important; }
            .cl-formFieldInput { background: #0D1E30 !important; border: 1px solid rgba(74,127,167,0.4) !important; color: #ffffff !important; border-radius: 10px !important; height: 44px !important; font-size: 14px !important; }
            .cl-formFieldInput:focus { border-color: #4A7FA7 !important; box-shadow: 0 0 0 2px rgba(74,127,167,0.25) !important; outline: none !important; }
            .cl-formFieldInput::placeholder { color: rgba(179,207,229,0.4) !important; }
            .cl-formFieldInputShowPasswordButton { color: #B3CFE5 !important; }
            .cl-formFieldInputShowPasswordButton:hover { color: #ffffff !important; }
            .cl-formButtonPrimary { background: linear-gradient(135deg, #4A7FA7, #2A5F8A) !important; color: #ffffff !important; font-weight: 700 !important; font-size: 0.85rem !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; height: 44px !important; border-radius: 10px !important; border: none !important; box-shadow: 0 4px 15px rgba(74,127,167,0.35) !important; }
            .cl-formButtonPrimary:hover { opacity: 0.9 !important; }
            .cl-footer { background: rgba(13,30,48,0.6) !important; border-top: 1px solid rgba(74,127,167,0.2) !important; }
            .cl-footerActionText { color: #B3CFE5 !important; }
            .cl-footerActionLink { color: #63B3ED !important; font-weight: 700 !important; }
            .cl-footerActionLink:hover { color: #B3CFE5 !important; }
            .cl-footerPages { background: transparent !important; }
            .cl-formFieldErrorText { color: #FC6E6E !important; font-weight: 600 !important; }
            .cl-alert { background: #0D1E30 !important; border: 1px solid rgba(74,127,167,0.3) !important; }
            .cl-alertText { color: #ffffff !important; }
            .cl-identityPreviewText { color: #ffffff !important; }
            .cl-identityPreviewEditButton { color: #63B3ED !important; }
            /* Reset inherited pink from root body */
            .cl-rootBox, .cl-rootBox * { color: #ffffff; }
            .cl-card, .cl-card * { color: #ffffff; }
          `}</style>

          <SignUp
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
