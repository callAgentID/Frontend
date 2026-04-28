"use client";

import { useState, useEffect } from "react";
import { 
  FileSearch, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  Search,
  MoreVertical,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Question {
  question_id: string;
  text: string;
  type: string;
  required: boolean;
  weight: number;
}

interface Section {
  section_id: string;
  title: string;
  questions: Question[];
}

interface Questionnaire {
  id: string;
  name: string;
  description: string;
  schema_definition: {
    sections: Section[];
  };
  active: boolean;
  version: number;
  created_at: string;
}

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuestionnaires = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/questionnaires/?skip=0&limit=100`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (!res.ok) throw new Error("Failed to fetch strategic schemas");
      const data = await res.json();
      setQuestionnaires(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const handleCreateQuestionnaire = async () => {
    if (!createForm.name) return;
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/questionnaires/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          schema_definition: { sections: [] },
          active: true
        })
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setCreateForm({ name: "", description: "" });
        fetchQuestionnaires();
      }
    } catch (err: any) {
      console.error("Failed to create schema:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = questionnaires.filter(q => 
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-[#F4F8F9]/50 p-8 space-y-10">
      {/* Header Strategy */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#1F3A34] flex items-center justify-center text-white apple-shadow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#1F3A34] tracking-tight">Audit Frameworks</h1>
          </div>
          <p className="text-[#1F3A3470] text-sm font-medium">Manage neural intelligence questionnaires and compliance schemas.</p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-[#1F3A34] text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#1F3A34E0] apple-shadow active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          Create Schema
        </button>
      </div>

      {/* Intelligence Filter */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1F3A3430] group-focus-within:text-[#1F3A34] transition-colors" />
        <input 
          type="text"
          placeholder="Filter schemas by name or objective..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 bg-white border border-[#1f3a3410] rounded-[1.25rem] pl-16 pr-6 text-[#1F3A34] font-bold tracking-tight placeholder:text-[#1F3A3430] outline-none focus:border-[#1F3A3420] transition-all apple-shadow-sm"
        />
      </div>

      {/* Strategic Schema List */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 border border-[#1f3a3405] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 bg-red-50 border border-red-100 rounded-3xl text-center space-y-4">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
             <p className="text-red-700 font-bold">{error}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Retry Connection</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
             <FileSearch className="w-16 h-16 text-[#1F3A3410] mx-auto" />
             <p className="text-[#1F3A3440] font-bold">No strategic schemas found matching your search.</p>
          </div>
        ) : (
          filtered.map((q) => (
            <div 
              key={q.id}
              className={cn(
                "group bg-white border rounded-[2rem] transition-all duration-500 overflow-hidden",
                expandedId === q.id ? "border-[#1F3A3420] apple-shadow-lg" : "border-[#1f3a3408] hover:border-[#1f3a3415] apple-shadow-sm"
              )}
            >
              <div 
                onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8 cursor-pointer"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-[850] text-[#1F3A34] tracking-tight">{q.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                      q.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      v{q.version} • {q.active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <p className="text-[#1F3A3460] text-sm font-medium leading-relaxed max-w-2xl">{q.description}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3430] mb-1">Sections</div>
                    <div className="text-lg font-[900] text-[#1F3A34]">{q.schema_definition.sections.length}</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3430] mb-1">Total Questions</div>
                    <div className="text-lg font-[900] text-[#1F3A34]">
                      {q.schema_definition.sections.reduce((acc, s) => acc + s.questions.length, 0)}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#1F3A3405] flex items-center justify-center text-[#1F3A3440] group-hover:bg-[#1F3A34] group-hover:text-white transition-all duration-500">
                    {expandedId === q.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                </div>
              </div>

              {expandedId === q.id && (
                <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                   <div className="h-px bg-[#1f3a3408]" />
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {q.schema_definition.sections.map((section) => (
                       <div key={section.section_id} className="bg-[#F4F8F9] rounded-3xl p-8 space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-black uppercase tracking-widest text-[#1F3A34] flex items-center gap-2">
                              <Layers className="w-4 h-4 opacity-40" /> {section.title}
                            </h4>
                            <span className="text-[10px] font-bold text-[#1F3A3440]">{section.questions.length} items</span>
                          </div>

                          <div className="space-y-3">
                            {section.questions.map((question) => (
                              <div key={question.question_id} className="bg-white p-4 rounded-2xl border border-[#1f3a3405] flex items-start gap-3 group/q">
                                <div className="w-6 h-6 rounded-lg bg-[#1F3A3408] flex items-center justify-center shrink-0 mt-0.5">
                                   <span className="text-[10px] font-black text-[#1F3A3460]">{question.weight}</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-bold text-[#1F3A3490] leading-tight">{question.text}</p>
                                  <div className="flex items-center gap-3">
                                     <span className="text-[9px] font-black uppercase tracking-tighter text-[#1F3A3430]">{question.type}</span>
                                     {question.required && <span className="text-[9px] font-black uppercase tracking-tighter text-red-400">Required</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#11231f20] backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-[#1f3a3410] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-[#1f3a3405] bg-[#1F3A3402] flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-[850] text-[#1F3A34] tracking-tight">Create Neural Schema</h3>
                    <p className="text-sm font-semibold text-[#1F3A3440] mt-1">Define a new strategic audit framework.</p>
                 </div>
                 <button onClick={() => setIsCreateModalOpen(false)} className="w-10 h-10 rounded-xl hover:bg-[#1F3A3410] flex items-center justify-center transition-all text-[#1F3A3420]">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Schema Name</label>
                   <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Sales Discovery Audit"
                    className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1F3A3440]">Description</label>
                   <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="What does this schema evaluate?"
                    className="w-full h-14 bg-[#1F3A3403] border border-[#1f3a3410] rounded-xl px-4 outline-none focus:border-[#1F3A34] transition-all text-[#1F3A34] font-semibold"
                   />
                 </div>
                 
                 <div className="pt-4">
                   <button onClick={handleCreateQuestionnaire} disabled={isSubmitting || !createForm.name} className="w-full h-14 bg-[#1F3A34] text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Initialize Schema</>}
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </main>
  );
}
