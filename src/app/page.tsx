"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  Zap,
  Activity,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Loader2,
  Play,
  RotateCcw
} from "lucide-react";
import { InputSection } from "@/components/InputSection";
import { ResultsPanel } from "@/components/ResultsPanel";
import { cn } from "../lib/utils";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('home');

  const [pipelineState, setPipelineState] = useState<"input" | "processing" | "results">("input");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);

  // Read call ID from URL on mount
  useEffect(() => {
    const callIdFromUrl = searchParams.get('callId');
    if (callIdFromUrl && !analysisResult) {
      fetchCallResult(callIdFromUrl);
    }
  }, [searchParams]);

  const fetchCallResult = async (callId: string) => {
    setIsLoadingFromUrl(true);
    setPipelineState("processing");
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const response = await fetch(`${baseUrl}/api/v1/calls/${callId}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);
        setPipelineState("results");
      } else {
        console.error("Failed to fetch call result");
        setPipelineState("input");
      }
    } catch (err) {
      console.error("Error fetching call result:", err);
      setPipelineState("input");
    } finally {
      setIsLoadingFromUrl(false);
    }
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysisResult(data);
    setPipelineState("results");

    // Update URL with call ID
    if (data?.call_id) {
      router.push(`/?callId=${data.call_id}`, { scroll: false });
    }

    // Ensure we stop showing processing if it was happening in parallel
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePartialResult = (data: any) => {
    setAnalysisResult(data);
    // Don't switch state to 'results' fully yet if we want to keep input visible,
    // but we want to show the panel.
  };

  const resetPipeline = () => {
    setPipelineState("input");
    setAnalysisResult(null);

    // Clear URL
    router.push('/', { scroll: false });
  };

  return (
    <div className="space-y-20 max-w-7xl mx-auto py-12 px-6">
      {/* Dynamic Navigation Indicator */}
      <div className="flex justify-center border-b border-[#1f3a3408] pb-8 mb-4">
        <div className="flex items-center gap-6">
          <StepIndicator step={1} active={pipelineState === 'input'} done={pipelineState !== 'input'} label={t('ingestion')} />
          <div className="w-8 h-[2px] bg-[#1F3A3410]" />
          <StepIndicator step={2} active={pipelineState === 'processing'} done={pipelineState === 'results'} label={t('aiEngine')} />
          <div className="w-8 h-[2px] bg-[#1F3A3410]" />
          <StepIndicator step={3} active={pipelineState === 'results'} done={false} label={t('intelligence')} />
        </div>
      </div>

      <div className="space-y-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {pipelineState === "input" && (
          <>
            {/* Section 1: Header */}
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-[#1F3A3410] text-[#11231f] text-[10px] uppercase font-[900] tracking-widest rounded-full">{t('signalIngestion')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <h2 className="text-[52px] font-[850] tracking-tight leading-none text-[#1F3A34]">
                {t('title')}
              </h2>
              <p className="text-[#1F3A3460] text-lg font-medium max-w-xl leading-relaxed">
                {t('subtitle')}
              </p>
            </div>

            {/* Section 2: Audio/Transcript Input */}
            <InputSection
              onAnalysisComplete={handleAnalysisComplete}
              onPartialResult={handlePartialResult}
            />
          </>
        )}

        {pipelineState === "processing" && (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative">
              <div className="w-24 h-24 rounded-[3rem] border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-8 h-8 text-[#1F3A34] fill-current animate-pulse delay-700" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-[850] text-[#1F3A34] tracking-tight">{t('aiAnalysis')}</h3>
              <p className="text-[#1F3A3450] text-sm font-bold uppercase tracking-widest animate-pulse">{t('syncMessage')}</p>
            </div>
          </div>
        )}

        {(pipelineState === "results" || (pipelineState === "input" && analysisResult)) && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1200">
            <div className="flex justify-end pr-4">
              <button
                onClick={resetPipeline}
                className="flex items-center gap-2.5 px-6 py-3 bg-[#1F3A3408] hover:bg-[#1F3A34] text-[#1F3A34] hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all apple-shadow active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> {t('resetFramework')}
              </button>
            </div>
            <ResultsPanel
              data={analysisResult}
              isHydrating={pipelineState !== "results"}
            />
          </div>
        )}
      </div>


    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1f3a3408] border-t-[#1F3A34] animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function StepIndicator({ step, active, done, label }: { step: number, active: boolean, done: boolean, label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all border-2",
        active ? "bg-[#1F3A34] text-[#F4F8F9] border-[#1F3A34] scale-110 shadow-xl shadow-[#1F3A3420]" :
          done ? "bg-[#1F3A3410] text-[#1F3A34] border-transparent" :
            "bg-transparent text-[#1F3A3420] border-[#1f3a3408]"
      )}>
        {done ? <Play className="w-4 h-4 fill-current opacity-80" /> : step}
      </div>
      <span className={cn(
        "text-[10px] uppercase font-black tracking-widest transition-colors",
        active ? "text-[#1F3A34]" : "text-[#1F3A3420]"
      )}>{label}</span>
    </div>
  );
}
