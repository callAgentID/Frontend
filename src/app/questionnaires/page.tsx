"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
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
  X,
  Upload,
  FileText,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { QuestionnaireCardSkeleton } from "@/components/Skeleton";

interface Question {
  question_id: string;
  text: string;
  type: string;
  required: boolean;
  weight: number;
  options?: string[];
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
  is_redflag: boolean;
  version: number;
  created_at: string;
}

function QuestionnairesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('questionnaires');

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    active: true,
    is_redflag: false,
    inputMode: "file" as "file" | "text",
    file: null as File | null,
    text: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    active: true,
    is_redflag: false
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const questionnaireIdFromUrl = searchParams.get('id');
    if (questionnaireIdFromUrl) {
      setExpandedId(questionnaireIdFromUrl);
    }
  }, [searchParams]);

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

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setEditForm({
      name: questionnaire.name,
      description: questionnaire.description,
      active: questionnaire.active,
      is_redflag: questionnaire.is_redflag
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateQuestionnaire = async () => {
    if (!editingQuestionnaire || !editForm.name) {
      alert("Please provide a questionnaire name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/questionnaires/${editingQuestionnaire.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          active: editForm.active,
          is_redflag: editForm.is_redflag
        })
      });

      if (res.ok) {
        const updatedQuestionnaire = await res.json();
        console.log("Updated questionnaire:", updatedQuestionnaire);
        setIsEditModalOpen(false);
        setEditingQuestionnaire(null);
        fetchQuestionnaires();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to update questionnaire:", errorData);
        alert(`Failed to update questionnaire: ${errorData.detail || "Please try again."}`);
      }
    } catch (err: any) {
      console.error("Failed to update questionnaire:", err);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestionnaire = async () => {
    if (!createForm.name) {
      alert("Please provide a questionnaire name.");
      return;
    }
    if (createForm.inputMode === "file" && !createForm.file) {
      alert("Please upload a questionnaire file.");
      return;
    }
    if (createForm.inputMode === "text" && !createForm.text.trim()) {
      alert("Please enter questionnaire text.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const formData = new FormData();

      formData.append("name", createForm.name);
      if (createForm.description) formData.append("description", createForm.description);
      formData.append("active", String(createForm.active));
      formData.append("is_redflag", String(createForm.is_redflag));

      let endpoint = "";
      if (createForm.inputMode === "file") {
        formData.append("file", createForm.file!);
        endpoint = `${baseUrl}/api/v1/questionnaires/upload`;
      } else {
        formData.append("text", createForm.text);
        endpoint = `${baseUrl}/api/v1/questionnaires/parse`;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true"
        },
        body: formData
      });

      if (res.ok) {
        const newQuestionnaire = await res.json();
        console.log("Created questionnaire:", newQuestionnaire);
        setIsCreateModalOpen(false);
        setCreateForm({
          name: "",
          description: "",
          active: true,
          is_redflag: false,
          inputMode: "file",
          file: null,
          text: ""
        });
        fetchQuestionnaires();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to create questionnaire:", errorData);
        alert(`Failed to create questionnaire: ${errorData.detail || "Please try again."}`);
      }
    } catch (err: any) {
      console.error("Failed to create schema:", err);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestionnaire = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/questionnaires/${id}`, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (res.ok) {
        console.log("Deleted questionnaire:", id);
        fetchQuestionnaires();
        if (expandedId === id) {
          setExpandedId(null);
          router.push('/questionnaires', { scroll: false });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to delete questionnaire:", errorData);
        alert(`Failed to delete questionnaire: ${errorData.detail || "Please try again."}`);
      }
    } catch (err: any) {
      console.error("Failed to delete questionnaire:", err);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const filtered = questionnaires.filter(q =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium">{t('subtitle')}</p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          {t('createSchema')}
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B3CFE5] group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder={t('filterSchemaPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 bg-[#1A3D63]/60 glow border border-[#4A7FA7]/30 rounded-[1.25rem] pl-16 pr-6 text-[#F6FAFD] font-bold tracking-tight placeholder:text-[#B3CFE5] outline-none focus:border-[#4A7FA7] transition-all"
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <QuestionnaireCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 bg-red-500/20 border border-red-500/30 rounded-3xl text-center space-y-4">
             <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
             <p className="text-red-400 font-bold">{error}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Retry Connection</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
             <FileSearch className="w-16 h-16 text-[#4A7FA7] mx-auto" />
             <p className="text-[#B3CFE5] font-bold">No strategic schemas found matching your search.</p>
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className={cn(
                "group bg-[#1A3D63]/60 glow border rounded-[2rem] transition-all duration-500 overflow-hidden",
                expandedId === q.id ? "border-[#4A7FA7]/50" : "border-[#4A7FA7]/30 hover:border-[#4A7FA7]/40"
              )}
            >
              <div className="p-8 flex flex-col md:flex-row items-start md:items-center gap-8">
                <div
                  onClick={() => {
                    const newExpandedId = expandedId === q.id ? null : q.id;
                    setExpandedId(newExpandedId);

                    if (newExpandedId) {
                      router.push(`/questionnaires?id=${newExpandedId}`, { scroll: false });
                    } else {
                      router.push('/questionnaires', { scroll: false });
                    }
                  }}
                  className="flex-1 space-y-2 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-[850] text-[#F6FAFD] tracking-tight">{q.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                      q.active ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/30" : "bg-[#1A3D63]/40 text-[#B3CFE5]"
                    )}>
                      v{q.version} • {q.active ? 'Active' : 'Archived'}
                    </span>
                    {q.is_redflag && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                        Red Flag
                      </span>
                    )}
                  </div>
                  <p className="text-[#B3CFE5] text-sm font-medium leading-relaxed max-w-2xl">{q.description}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] mb-1">{t('sections')}</div>
                    <div className="text-lg font-[900] text-[#F6FAFD]">{q.schema_definition?.sections?.length || 0}</div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5] mb-1">{t('totalQuestions')}</div>
                    <div className="text-lg font-[900] text-[#F6FAFD]">
                      {q.schema_definition?.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditQuestionnaire(q);
                    }}
                    className="w-10 h-10 rounded-xl bg-[#4A7FA7]/20 hover:bg-[#4A7FA7]/30 text-[#4A7FA7] flex items-center justify-center transition-all border border-[#4A7FA7]/30"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestionnaire(q.id, q.name);
                    }}
                    className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-all border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div
                    onClick={() => {
                      const newExpandedId = expandedId === q.id ? null : q.id;
                      setExpandedId(newExpandedId);
                      if (newExpandedId) {
                        router.push(`/questionnaires?id=${newExpandedId}`, { scroll: false });
                      } else {
                        router.push('/questionnaires', { scroll: false });
                      }
                    }}
                    className="w-12 h-12 rounded-2xl bg-[#1A3D63]/40 flex items-center justify-center text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white transition-all duration-500 cursor-pointer"
                  >
                    {expandedId === q.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </div>
                </div>
              </div>

              {expandedId === q.id && (
                <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                   <div className="h-px bg-[#4A7FA7]/30" />

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {q.schema_definition?.sections?.map((section) => (
                       <div key={section.section_id} className="bg-[#1A3D63]/40 rounded-3xl p-8 space-y-6 border border-[#4A7FA7]/30">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-black uppercase tracking-widest text-[#F6FAFD] flex items-center gap-2">
                              <Layers className="w-4 h-4 opacity-60" /> {section.title}
                            </h4>
                            <span className="text-[10px] font-bold text-[#B3CFE5]">{section.questions?.length || 0} items</span>
                          </div>

                          <div className="space-y-3">
                            {section.questions?.map((question) => (
                              <div key={question.question_id} className="bg-[#1A3D63]/60 p-4 rounded-2xl border border-[#4A7FA7]/20 space-y-3 group/q">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-lg bg-[#4A7FA7]/20 flex items-center justify-center shrink-0 mt-0.5">
                                     <span className="text-[10px] font-black text-[#4A7FA7]">{question.weight}</span>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <p className="text-sm font-bold text-[#F6FAFD] leading-tight">{question.text}</p>
                                    <div className="flex items-center gap-3">
                                       <span className="text-[9px] font-black uppercase tracking-tighter text-[#B3CFE5]">{question.type}</span>
                                       {question.required && <span className="text-[9px] font-black uppercase tracking-tighter text-red-400">Required</span>}
                                    </div>
                                  </div>
                                </div>

                                {question.options && question.options.length > 0 && (
                                  <div className="pl-9 space-y-1.5">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5] mb-2">Options ({question.options.length}):</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {question.options.map((option, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 rounded-md bg-[#1A3D63]/40 border border-[#4A7FA7]/20 text-[10px] font-semibold text-[#B3CFE5]"
                                        >
                                          {option}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#1A3D63]/95 glow w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-[#4A7FA7]/30 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
              <div className="p-8 border-b border-[#4A7FA7]/30 bg-[#1A3D63]/40 flex items-center justify-between shrink-0">
                 <div>
                    <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">Create Neural Schema</h3>
                    <p className="text-sm font-semibold text-[#B3CFE5] mt-1">Define a new strategic audit framework.</p>
                 </div>
                 <button onClick={() => {
                   setIsCreateModalOpen(false);
                   setCreateForm({ name: "", description: "", active: true, is_redflag: false, inputMode: "file", file: null, text: "" });
                 }} className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto flex-1">
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Schema Name *</label>
                     <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Sales Discovery Audit"
                      className="w-full h-14 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-all text-[#F6FAFD] font-semibold placeholder:text-[#B3CFE5]/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Description</label>
                     <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="What does this schema evaluate?"
                      rows={2}
                      className="w-full bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 py-3 outline-none focus:border-[#4A7FA7] transition-all text-[#F6FAFD] font-medium placeholder:text-[#B3CFE5]/50 resize-none"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Status</label>
                       <div className="flex items-center gap-3 p-4 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl">
                         <input
                           type="checkbox"
                           id="active"
                           checked={createForm.active}
                           onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })}
                           className="w-5 h-5 rounded border-[#4A7FA7]/30 text-[#4A7FA7]"
                         />
                         <label htmlFor="active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                           Active
                         </label>
                       </div>
                     </div>

                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Type</label>
                       <div className="flex items-center gap-3 p-4 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl">
                         <input
                           type="checkbox"
                           id="is_redflag"
                           checked={createForm.is_redflag}
                           onChange={(e) => setCreateForm({ ...createForm, is_redflag: e.target.checked })}
                           className="w-5 h-5 rounded border-[#4A7FA7]/30 text-red-500"
                         />
                         <label htmlFor="is_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                           Red Flag Questionnaire
                         </label>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Input Method *</label>
                   <div className="flex p-1.5 bg-[#1A3D63]/40 rounded-xl border border-[#4A7FA7]/20">
                     <button
                       type="button"
                       onClick={() => setCreateForm({ ...createForm, inputMode: "file" })}
                       className={cn(
                         "flex-1 py-3 rounded-lg text-sm font-extrabold transition-all",
                         createForm.inputMode === "file"
                           ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                           : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                       )}
                     >
                       <Upload className="w-4 h-4 inline-block mr-2" />
                       Upload File (.docx/.pdf)
                     </button>
                     <button
                       type="button"
                       onClick={() => setCreateForm({ ...createForm, inputMode: "text" })}
                       className={cn(
                         "flex-1 py-3 rounded-lg text-sm font-extrabold transition-all",
                         createForm.inputMode === "text"
                           ? "bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-[#F6FAFD] glow"
                           : "text-[#B3CFE5]/70 hover:text-[#F6FAFD]"
                       )}
                     >
                       <FileText className="w-4 h-4 inline-block mr-2" />
                       Paste Text
                     </button>
                   </div>
                 </div>

                 {createForm.inputMode === "file" ? (
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Questionnaire Document *</label>
                     <div
                       onClick={() => {
                         const input = document.createElement("input");
                         input.type = "file";
                         input.accept = ".docx,.pdf";
                         input.onchange = (e: any) => {
                           const file = e.target.files[0];
                           if (file) {
                             setCreateForm({ ...createForm, file });
                           }
                         };
                         input.click();
                       }}
                       className="w-full h-24 border-2 border-dashed border-[#4A7FA7]/30 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#1A3D63]/40 transition-all group"
                     >
                       <div className="w-12 h-12 rounded-xl bg-[#1A3D63]/40 group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] flex items-center justify-center text-[#4A7FA7] group-hover:text-white transition-all">
                         <Upload className="w-6 h-6" />
                       </div>
                       <span className="text-sm font-bold text-[#B3CFE5]">
                         {createForm.file ? createForm.file.name : "Click to select .docx or .pdf file"}
                       </span>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Questionnaire Text *</label>
                     <textarea
                       value={createForm.text}
                       onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
                       placeholder="Paste your questionnaire content here...&#10;&#10;Example:&#10;Section 1: Compliance&#10;Q1: Did the agent verify customer identity?&#10;Q2: Was data protection mentioned?"
                       rows={12}
                       className="w-full bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl p-4 outline-none focus:border-[#4A7FA7] transition-all text-[#F6FAFD] font-medium text-sm resize-none placeholder:text-[#B3CFE5]/40"
                     />
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-[#4A7FA7]/30 bg-[#1A3D63]/40 shrink-0">
                <button
                  onClick={handleCreateQuestionnaire}
                  disabled={
                    isSubmitting ||
                    !createForm.name ||
                    (createForm.inputMode === "file" && !createForm.file) ||
                    (createForm.inputMode === "text" && !createForm.text.trim())
                  }
                  className="w-full h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Create Questionnaire</>}
                </button>
              </div>
           </div>
        </div>
      )}

      {isEditModalOpen && editingQuestionnaire && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[#1A3D63]/95 glow w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-[#4A7FA7]/30 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 md:p-8 border-b border-[#4A7FA7]/30 bg-[#1A3D63]/40 flex items-center justify-between flex-shrink-0">
                 <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl md:text-2xl font-[850] text-[#F6FAFD] tracking-tight">Edit Questionnaire</h3>
                    <p className="text-xs md:text-sm font-semibold text-[#B3CFE5] mt-1 truncate">Update questionnaire properties</p>
                 </div>
                 <button onClick={() => {
                   setIsEditModalOpen(false);
                   setEditingQuestionnaire(null);
                 }} className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5] flex-shrink-0" title="Close edit dialog">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Schema Name *</label>
                   <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Sales Discovery Audit"
                    className="w-full h-12 md:h-14 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-all text-[#F6FAFD] font-semibold placeholder:text-[#B3CFE5]/50"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Description</label>
                   <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="What does this schema evaluate?"
                    rows={2}
                    className="w-full bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl px-4 py-3 outline-none focus:border-[#4A7FA7] transition-all text-[#F6FAFD] font-medium placeholder:text-[#B3CFE5]/50 resize-none"
                   />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Status</label>
                     <div className="flex items-center gap-3 p-3 md:p-4 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl">
                       <input
                         type="checkbox"
                         id="edit_active"
                         checked={editForm.active}
                         onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                         className="w-5 h-5 rounded border-[#4A7FA7]/30 text-[#4A7FA7]"
                       />
                       <label htmlFor="edit_active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                         Active
                       </label>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">Type</label>
                     <div className="flex items-center gap-3 p-3 md:p-4 bg-[#1A3D63]/40 border border-[#4A7FA7]/30 rounded-xl">
                       <input
                         type="checkbox"
                         id="edit_is_redflag"
                         checked={editForm.is_redflag}
                         onChange={(e) => setEditForm({ ...editForm, is_redflag: e.target.checked })}
                         className="w-5 h-5 rounded border-[#4A7FA7]/30 text-red-500"
                       />
                       <label htmlFor="edit_is_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                         Red Flag Questionnaire
                       </label>
                     </div>
                   </div>
                 </div>
              </div>

              <div className="p-4 md:p-6 border-t border-[#4A7FA7]/30 bg-[#1A3D63]/40 flex-shrink-0">
                <button onClick={handleUpdateQuestionnaire} disabled={isSubmitting || !editForm.name} className="w-full h-12 md:h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all" title="Save changes to questionnaire">
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Update Questionnaire</>}
                </button>
              </div>
           </div>
        </div>,
        document.body
      )}
    </main>
  );
}

export default function QuestionnairesPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[#1A3D63]/40 border-t-[#4A7FA7] animate-spin" />
      </div>
    }>
      <QuestionnairesPageContent />
    </Suspense>
  );
}
