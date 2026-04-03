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
import { cn } from "@/lib/utils";

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
    <div className="w-full max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1200 delay-150">
      <div className="flex flex-col gap-2 items-center text-center px-4">
        <h3 className="text-xl font-[850] text-[#1F3A34] tracking-tight">Configuration</h3>
        <p className="text-[#1F3A3450] text-xs font-bold uppercase tracking-widest leading-none mt-1">Campaign & Template Parameters</p>
      </div>

      <div className="glass-blur apple-blur bg-white p-10 rounded-[40px] apple-shadow border border-[#1f3a3405] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-end">
        {/* Campaign Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#1F3A3450] flex items-center gap-2 px-1">
            <Settings2 className="w-3.5 h-3.5" /> Campaign Selection
          </label>
          <div className="relative group">
            <select 
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              className="w-full h-14 pl-5 pr-12 bg-[#1F3A3408] border border-transparent rounded-2xl text-[14px] font-bold text-[#1F3A34] appearance-none focus:outline-none focus:bg-white focus:apple-shadow focus:border-[#1f3a3410] transition-all"
            >
              {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3440] group-hover:text-[#1F3A34] transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#1F3A3450] flex items-center gap-2 px-1">
            <ClipboardCheck className="w-3.5 h-3.5" /> QA Template
          </label>
          <div className="relative group">
            <select 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-14 pl-5 pr-12 bg-[#1F3A3408] border border-transparent rounded-2xl text-[14px] font-bold text-[#1F3A34] appearance-none focus:outline-none focus:bg-white focus:apple-shadow focus:border-[#1f3a3410] transition-all"
            >
              {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1F3A3440] group-hover:text-[#1F3A34] transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Call ID Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
             <label className="text-[11px] font-bold uppercase tracking-widest text-[#1F3A3450] flex items-center gap-2">
               <Hash className="w-3.5 h-3.5" /> Call Reference Identification
             </label>
             <button 
                onClick={generateId}
                className="text-[#1F3A3480] hover:text-[#1F3A34] transition-colors"
                title="Regenerate ID"
             >
                <RefreshCw className="w-3 h-3" />
             </button>
          </div>
          <div className="w-full h-14 flex items-center px-5 bg-[#1F3A3410] rounded-2xl text-[14px] font-black text-[#1F3A34] tracking-tight border border-[#1f3a3405]">
             {callId}
          </div>
        </div>

        {/* Process Button - Centered below or taking full width if needed */}
        <div className="md:col-span-2 lg:col-span-3 pt-6 border-t border-[#1f3a3408] mt-2">
           <button 
              disabled={disabled}
              onClick={() => onProcess({ campaign, template, callId })}
              className="w-full h-16 rounded-[1.25rem] bg-[#1F3A34] hover:bg-[#2A4D45] disabled:bg-[#1F3A3440] text-white text-base font-extrabold shadow-xl shadow-[#1F3A3415] transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
           >
              <Play className="w-5 h-5 fill-current text-white/50 group-hover:text-white transition-colors" />
              Analyze Data Stream
           </button>
        </div>
      </div>
    </div>
  );
}
