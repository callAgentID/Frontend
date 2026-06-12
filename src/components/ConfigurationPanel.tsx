"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  Hash,
  Settings2,
  Play,
  ClipboardCheck,
  RefreshCw
} from "lucide-react";

const CAMPAIGNS = ["Outbound Sales Q2", "Inbound Customer Care", "Compliance Audit v4", "High-Value Retention"];
const TEMPLATES = ["Standard QA Checklist", "Sales Script Adherence", "Regulatory Compliance", "Sentiment & Tone Review"];

interface ConfigPanelProps {
  onProcess: (config: { campaign: string; template: string; callId: string }) => void;
  disabled?: boolean;
}

export function ConfigurationPanel({ onProcess, disabled }: ConfigPanelProps) {
  const [campaign, setCampaign] = useState(CAMPAIGNS[0]);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [callId, setCallId] = useState("");

  const generateId = () => {
    const id = `CALL-${Math.floor(100000 + Math.random() * 900000)}-X`;
    setCallId(id);
  };

  useEffect(() => {
    generateId();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in duration-150 duration-150 delay-150">
      <div className="flex flex-col gap-2 items-center text-center px-4">
        <h3 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">Configuration</h3>
        <p className="text-[#B3CFE5]/70 text-xs font-bold uppercase tracking-widest leading-none mt-1">Campaign & Template Parameters</p>
      </div>

      <div className="glass-blur apple-blur bg-blue-950/25 p-10 rounded-[40px] glow border border-blue-400/15 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-end">
        {/* Campaign Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#B3CFE5]/70 flex items-center gap-2 px-1">
            <Settings2 className="w-3.5 h-3.5" /> Campaign Selection
          </label>
          <div className="relative group">
            <select
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full h-14 pl-5 pr-12 bg-[#1A3D63]/80 border border-blue-400/15 rounded-2xl text-[14px] font-bold text-[#F6FAFD] appearance-none focus:outline-none focus:bg-[#1A3D63]/95 focus:glow focus:border-[#4A7FA7]/50 transition-colors"
            >
              {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3CFE5]/60 group-hover:text-[#4A7FA7] transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#B3CFE5]/70 flex items-center gap-2 px-1">
            <ClipboardCheck className="w-3.5 h-3.5" /> QA Template
          </label>
          <div className="relative group">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-14 pl-5 pr-12 bg-[#1A3D63]/80 border border-blue-400/15 rounded-2xl text-[14px] font-bold text-[#F6FAFD] appearance-none focus:outline-none focus:bg-[#1A3D63]/95 focus:glow focus:border-[#4A7FA7]/50 transition-colors"
            >
              {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B3CFE5]/60 group-hover:text-[#4A7FA7] transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Call ID Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#B3CFE5]/70 flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" /> Call Reference Identification
            </label>
            <button
              onClick={generateId}
              className="text-[#B3CFE5]/80 hover:text-[#4A7FA7] transition-colors"
             
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="w-full h-14 flex items-center px-5 bg-[#1A3D63]/80 rounded-2xl text-[14px] font-black text-[#4A7FA7] tracking-tight border border-blue-400/15">
            {callId}
          </div>
        </div>

        {/* Process Button - Centered below or taking full width if needed */}
        <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-blue-400/10 mt-2">
          <button
            disabled={disabled}
            onClick={() => onProcess({ campaign, template, callId })}
            className="w-full h-16 rounded-[1.25rem] bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] hover:from-[#4A7FA7]/90 hover:to-[#1A3D63]/90 disabled:from-[#1A3D63]/50 disabled:to-[#0A1931]/50 text-[#F6FAFD] text-base font-extrabold transition-colors flex items-center justify-center gap-3 group active:scale-[0.98] border border-blue-400/22"
          >
            <Play className="w-5 h-5 fill-current text-[#B3CFE5]/70 group-hover:text-[#F6FAFD] transition-colors" />
            Analyze Data Stream
          </button>
        </div>
      </div>
    </div>
  );
}
