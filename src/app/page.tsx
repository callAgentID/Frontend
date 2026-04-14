"use client";

import { useState } from "react";
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
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { cn } from "../lib/utils";

const STATS = [
  { name: "Total Intelligence Signals", value: "2,431", change: "+12.4%", status: "up", icon: Activity },
  { name: "Aggregate Sentiment Score", value: "88%", change: "+5.1%", status: "up", icon: TrendingUp },
  { name: "Processing Accuracy", value: "94.2%", change: "+2%", status: "up", icon: Sparkles },
  { name: "Active Discussion Threads", value: "142", change: "-3%", status: "down", icon: MessageSquare },
];

export default function Home() {
  const [pipelineState, setPipelineState] = useState<"input" | "processing" | "results">("input");
  const [transcript, setTranscript] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleTranscriptReady = (t: string) => {
    setTranscript(t);
    // Smooth scroll to configuration section
    setTimeout(() => {
      document.getElementById("config-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const startAnalysis = async (config: { campaign: string; template: string; callId: string }) => {
    if (!transcript) return;
    
    setPipelineState("processing");

    // Full Pipeline Simulation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockResult = {
      callId: config.callId,
      campaign: config.campaign,
      template: config.template,
      transcript: transcript,
      metrics: {
        sentiment: "Positive",
        redFlags: 0,
        silence: "4.2s (8.1%)",
        confidence: 0.962
      },
      qa: [
        { 
          q: "Did the representative identify themselves clearly?", 
          a: "Yes", 
          confidence: 0.98, 
          evidence: "Hello, my name is John from the Global Solutions team." 
        },
        { 
          q: "Was the purpose of the call stated within the first 30 seconds?", 
          a: "Yes", 
          confidence: 0.94, 
          evidence: "I'm calling about our new conversation intelligence suite designed for Enterprise managers." 
        },
        { 
          q: "Did the agent address the prospect by their professional title?", 
          a: "No", 
          confidence: 0.88, 
          evidence: "Am I speaking with the decision maker today?" 
        }
      ]
    };

    setAnalysisResult(mockResult);
    setPipelineState("results");
  };

  const resetPipeline = () => {
    setPipelineState("input");
    setTranscript("");
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-20 max-w-7xl mx-auto py-12 px-6">
      {/* Dynamic Navigation Indicator */}
      <div className="flex justify-center border-b border-[#1f3a3408] pb-8 mb-4">
         <div className="flex items-center gap-10">
            <StepIndicator step={1} active={pipelineState === 'input'} done={pipelineState !== 'input'} label="Input & Config" />
            <div className="w-12 h-[2px] bg-[#1F3A3410]" />
            <StepIndicator step={2} active={pipelineState === 'processing'} done={pipelineState === 'results'} label="AI Engine Processing" />
            <div className="w-12 h-[2px] bg-[#1F3A3410]" />
            <StepIndicator step={3} active={pipelineState === 'results'} done={false} label="Intelligence Output" />
         </div>
      </div>

      {pipelineState === "input" && (
        <div className="space-y-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           {/* Section 1: Header */}
           <div className="flex flex-col gap-4 text-center items-center">
              <div className="flex items-center gap-2 mb-2">
                 <span className="px-3 py-1 bg-[#1F3A3410] text-[#11231f] text-[10px] uppercase font-[900] tracking-widest rounded-full">Pipeline Testbed</span>
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
              <h2 className="text-[52px] font-[850] tracking-tight leading-none text-[#1F3A34]">
                 Configure Your Signal Analysis
              </h2>
              <p className="text-[#1F3A3460] text-lg font-medium max-w-xl leading-relaxed">
                 Seamlessly transition from raw audio data to intelligent conversation insights in minutes.
              </p>
           </div>

           {/* Section 2: Audio/Transcript Input */}
           <InputSection onTranscriptReady={handleTranscriptReady} />

           {/* Section 3: Configuration & Processing Button */}
           {transcript && (
              <div id="config-section" className="scroll-mt-20">
                <ConfigurationPanel 
                   onProcess={startAnalysis}
                   disabled={!transcript}
                />
              </div>
           )}

           {/* Secondary Stats Summary (Visible in input state) */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-10 border-t border-[#1f3a3405]">
              {STATS.map((stat) => (
                <div key={stat.name} className="flex gap-6 items-center p-6 border border-transparent hover:border-[#1f3a3410] rounded-3xl transition-all group">
                   <div className="w-14 h-14 rounded-2xl bg-[#1F3A3408] text-[#1F3A3420] group-hover:bg-[#1F3A34] group-hover:text-white flex items-center justify-center transition-all">
                      <stat.icon className="w-6 h-6 stroke-[1.5px]" />
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-[#1F3A3440] uppercase tracking-widest mb-1">{stat.name}</p>
                      <h4 className="text-xl font-extrabold text-[#1F3A34] tracking-tight">{stat.value}</h4>
                   </div>
                </div>
              ))}
           </div>
        </div>
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
              <h3 className="text-3xl font-[850] text-[#1F3A34] tracking-tight">AI Signal Analysis in Progress</h3>
              <p className="text-[#1F3A3450] text-sm font-bold uppercase tracking-widest animate-pulse">Cognitive Engine Synchronization...</p>
           </div>
        </div>
      )}

      {pipelineState === "results" && analysisResult && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1200">
           <div className="flex justify-end pr-4">
              <button 
                onClick={resetPipeline}
                className="flex items-center gap-2.5 px-6 py-3 bg-[#1F3A3408] hover:bg-[#1F3A34] text-[#1F3A34] hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all apple-shadow active:scale-95"
              >
                <RotateCcw className="w-4 h-4" /> Reset Analysis Framework
              </button>
           </div>
           <ResultsPanel data={analysisResult} />
        </div>
      )}
    </div>
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
