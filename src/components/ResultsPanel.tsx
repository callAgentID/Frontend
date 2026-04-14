"use client";

import {
  BarChart3,
  MessageSquareQuote,
  ScrollText,
  Target,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Search
} from "lucide-react";
import { cn } from "../lib/utils";

interface ResultData {
  callId: string;
  transcript: string;
  campaign: string;
  template: string;
  metrics: {
    sentiment: string;
    redFlags: number;
    silence: string;
    confidence: number;
  };
  qa: Array<{
    q: string;
    a: string;
    confidence: number;
    evidence: string;
  }>;
}

export function ResultsPanel({ data }: { data: ResultData }) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-[#1f3a3408] pb-12">
        <div>
          <div className="flex items-center gap-3 mb-2 px-1">
            <span className="px-3 py-1 bg-[#1F3A3410] text-[#1F3A34] text-[10px] uppercase font-[900] tracking-widest rounded-full">Analysis Complete</span>
            <span className="text-[10px] font-bold text-[#1F3A3440] uppercase tracking-widest leading-none">Reference: {data.callId}</span>
          </div>
          <h2 className="text-[40px] font-[850] text-[#1F3A34] tracking-tight leading-none mb-4">Intel Output</h2>
          <p className="text-[#1F3A3450] text-[15px] font-medium max-w-sm leading-relaxed">Generated intelligence for <span className="text-[#1F3A34] font-bold">{data.campaign}</span> using the {data.template} logic.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* Mini Overview Cards */}
          <MetricCard label="Sentiment" value={data.metrics.sentiment} icon={data.metrics.sentiment === 'Positive' ? TrendingUp : TrendingDown} color={data.metrics.sentiment === 'Positive' ? 'green' : 'red'} />
          <MetricCard label="Red Flags" value={data.metrics.redFlags.toString()} icon={ShieldAlert} color={data.metrics.redFlags === 0 ? 'green' : 'red'} />
          <MetricCard label="Silence duration" value={data.metrics.silence} icon={Clock} color="neutral" />
          <MetricCard label="System Confidence" value={(data.metrics.confidence * 100).toFixed(0) + "%"} icon={Zap} color="green" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 pt-8 items-start">
        {/* Main Content Area: Transcript & QA */}
        <div className="lg:col-span-3 space-y-16">

          {/* Detailed QA Findings */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight flex items-center gap-3">
                <Target className="w-5 h-5 text-[#1F3A3460]" /> Questionnaire Insight
              </h4>
              <span className="text-[11px] font-bold text-[#1F3A3430] uppercase tracking-[0.15em] shrink-0">Logical Analysis</span>
            </div>

            <div className="space-y-6">
              {data.qa.map((item, idx) => (
                <div key={idx} className="group glass-blur bg-white apple-shadow p-8 rounded-[2.5rem] border border-[#1f3a3405] hover:apple-shadow-hover transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-[#1F3A3408] text-[#1F3A3450] group-hover:text-[#1F3A34] transition-colors shrink-0">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-black uppercase tracking-widest shrink-0",
                      item.a.toLowerCase() === 'yes' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                    )}>
                      Result: {item.a}
                    </div>
                  </div>
                  <h5 className="text-[17px] font-extrabold text-[#1F3A34] mb-3 tracking-tight leading-snug">{item.q}</h5>
                  <p className="text-[11px] font-bold text-[#1F3A3430] uppercase tracking-widest mb-6 border-b border-[#1f3a3408] pb-1">Confidence Score: {(item.confidence * 100).toFixed(0)}%</p>
                  <div className="p-6 rounded-2xl bg-[#F4F8F9] border border-[#1f3a3405] italic text-[#1F3A3470] text-sm leading-relaxed group-hover:border-[#1f3a3410] transition-colors relative overflow-hidden">
                    <MessageSquareQuote className="absolute -top-1 -right-1 w-12 h-12 text-[#1F3A3405] fill-current" />
                    "{item.evidence}"
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Full Transcript Area */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-[#1F3A3460]" /> Signal Transcript
              </h4>
              <span className="text-[11px] font-bold text-[#1F3A3430] uppercase tracking-[0.15em] shrink-0">Full Recording Extraction</span>
            </div>

            <div className="p-10 rounded-[3rem] bg-[#1F3A3405] border border-[#1f3a3403] text-[#1F3A3480] text-lg leading-[1.8] font-[450] apple-blur font-mono text-[14px]">
              {data.transcript.split('\n').map((line, i) => <p key={i} className="mb-4">{line}</p>)}
            </div>
          </section>
        </div>

        {/* Sidebar Area: Metadata & Script */}
        <div className="lg:col-span-2 space-y-12 py-4">
          {/* Call Stats Summary */}
          <div className="rounded-[2.5rem] bg-[#1F3A34] p-10 apple-shadow text-white relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-48 h-48 text-white stroke-[0.5px]" />
            </div>
            <div className="relative">
              <span className="px-3 py-1 bg-white/10 text-white text-[10px] uppercase font-bold tracking-widest rounded-full mb-6 inline-block">Scoreboard</span>
              <h4 className="text-3xl font-[850] text-[#F4F8F9] leading-tight mb-8">Performance <br />Matrix Matrix</h4>
              <div className="space-y-6">
                <StatItem label="Sentiment Analysis" value={data.metrics.sentiment} />
                <StatItem label="Silence Index" value={data.metrics.silence} />
                <StatItem label="Risk Red Flags" value={data.metrics.redFlags === 0 ? "None Detected" : `${data.metrics.redFlags} Found`} />
                <StatItem label="Processing Speed" value="1.2s" />
              </div>
            </div>
          </div>

          {/* Campaign Script Reference */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <ScrollText className="w-5 h-5 text-[#1F3A3460]" />
              <h4 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Script Reference</h4>
            </div>
            <div className="p-8 rounded-[2rem] bg-white apple-shadow border border-[#1f3a3408] text-[13px] font-medium text-[#1F3A3470] leading-relaxed relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target className="w-16 h-16" />
              </div>
              <p className="description font-[400] text-[#1F3A3440] uppercase tracking-widest mb-4 border-b border-[#1f3a3408] pb-1 mt-1 font-bold">Standard Introduction Script</p>
              <p className="italic">"Hello, this is John from the Global Solutions team. Am I speaking with the decision maker today? I'm calling about our new conversation intelligence suite designed for Enterprise managers like yourself..."</p>
            </div>
          </div>

          {/* AI Confidence Sparkle */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#1F3A3410] to-transparent border border-[#1f3a3408] flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white apple-shadow flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-yellow-500 fill-current opacity-80" />
            </div>
            <p className="text-[13px] font-extrabold text-[#1F3A34] leading-snug">AI Processing Confidence is extremely high in this analysis result.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: 'green' | 'red' | 'neutral' }) {
  return (
    <div className="p-4 rounded-3xl bg-white apple-shadow border border-[#1f3a3403] min-w-[140px] group hover:scale-[1.03] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl bg-[#1F3A3408] text-[#1F3A3440]">
          <Icon className="w-4 h-4 stroke-[1.5px]" />
        </div>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : 'bg-[#1F3A3420]'
        )} />
      </div>
      <p className="text-[10px] font-bold text-[#1F3A3440] uppercase tracking-widest leading-none mb-1">{label}</p>
      <h5 className="text-[16px] font-black text-[#1F3A34] tracking-tight">{value}</h5>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/10 group-last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
      <span className="text-[11px] font-[800] text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-[14px] font-[850] text-white/90">{value}</span>
    </div>
  );
}
