"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { useApi } from "@/lib/useApi";
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
  Trash2,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { QuestionnaireCardSkeleton } from "@/components/Skeleton";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { InlineQuestionnaireEditor, Section, Question } from "@/components/InlineQuestionnaireEditor";
import { Tooltip } from "@/components/Tooltip";
import { toast } from "@/components/Toast";

interface Questionnaire {
  id: string;
  name: string;
  description: string;
  schema_definition: {
    sections: Section[];
  };
  active: boolean;
  is_redflag: boolean;
  is_global?: boolean;
  version: number;
  created_at: string;
}

function QuestionnairesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('questionnaires');
  const tt = useTranslations('tooltips');
  const { apiFetch } = useApi();
  const { role, isSuperAdmin } = useCurrentUser();
  const isAdminOrManager = isSuperAdmin || role === "admin" || role === "manager";
  const canModifyQuestionnaire = (questionnaire?: Questionnaire | null) =>
    !!questionnaire && isAdminOrManager && (!questionnaire.is_global || isSuperAdmin);

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
  const [editingQuestionnaireId, setEditingQuestionnaireId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    name: "",
    description: "",
    active: true,
    is_redflag: false,
    sections: [] as Section[]
  });
  const [mounted, setMounted] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [downloadFormatFor, setDownloadFormatFor] = useState<Questionnaire | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const res = await apiFetch(`/api/v1/questionnaires/?skip=0&limit=100`);
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
    if (!canModifyQuestionnaire(questionnaire)) {
      toast("Only super admins can edit global questionnaires.", "error");
      return;
    }

    setEditingQuestionnaire(questionnaire);
    setEditForm({
      name: questionnaire.name,
      description: questionnaire.description,
      active: questionnaire.active,
      is_redflag: questionnaire.is_redflag
    });
    setIsEditModalOpen(true);
  };

  const handleEditInline = (questionnaireId: string) => {
    const questionnaire = questionnaires.find(q => q.id === questionnaireId);
    if (!canModifyQuestionnaire(questionnaire)) {
      toast("Only super admins can edit global questionnaires.", "error");
      return;
    }

    setEditingQuestionnaireId(questionnaireId);
    setExpandedId(questionnaireId);
  };

  const handleSaveInlineEdit = async (questionnaireId: string, sections: Section[]) => {
    try {
      const questionnaire = questionnaires.find(q => q.id === questionnaireId);
      if (!questionnaire) return;
      if (!canModifyQuestionnaire(questionnaire)) {
        toast("Only super admins can edit global questionnaires.", "error");
        setEditingQuestionnaireId(null);
        return;
      }

      const res = await apiFetch(`/api/v1/questionnaires/${questionnaireId}`, {
        method: "PATCH",
        headers: { "accept": "application/json" },
        body: JSON.stringify({
          schema_definition: { sections }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update questionnaire");
      }

      setEditingQuestionnaireId(null);
      fetchQuestionnaires();
    } catch (error: any) {
      toast(error.message || "Failed to save questionnaire. Please try again.", "error");
      throw error;
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingQuestionnaireId(null);
  };

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setNewQuestionnaire({
      name: "",
      description: "",
      active: true,
      is_redflag: false,
      sections: []
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveNewQuestionnaire = async (sections: Section[]) => {
    if (!newQuestionnaire.name.trim()) {
      toast("Please provide a questionnaire name.", "error");
      throw new Error("Name is required");
    }

    try {
      const res = await apiFetch(`/api/v1/questionnaires/`, {
        method: "POST",
        headers: { "accept": "application/json" },
        body: JSON.stringify({
          name: newQuestionnaire.name,
          description: newQuestionnaire.description,
          active: newQuestionnaire.active,
          is_redflag: newQuestionnaire.is_redflag,
          schema_definition: { sections }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create questionnaire");
      }

      setIsCreatingNew(false);
      setNewQuestionnaire({
        name: "",
        description: "",
        active: true,
        is_redflag: false,
        sections: []
      });
      fetchQuestionnaires();
    } catch (error: any) {
      toast(error.message || "Failed to create questionnaire. Please try again.", "error");
      throw error;
    }
  };

  const handleCancelCreate = () => {
    if (newQuestionnaire.sections.length > 0 || newQuestionnaire.name.trim()) {
      // just proceed — discard without prompting
    }
    setIsCreatingNew(false);
    setNewQuestionnaire({
      name: "",
      description: "",
      active: true,
      is_redflag: false,
      sections: []
    });
  };

  const handleUpdateQuestionnaire = async () => {
    if (!editingQuestionnaire || !editForm.name) {
      toast("Please provide a questionnaire name.", "error");
      return;
    }
    if (!canModifyQuestionnaire(editingQuestionnaire)) {
      toast("Only super admins can edit global questionnaires.", "error");
      setIsEditModalOpen(false);
      setEditingQuestionnaire(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/v1/questionnaires/${editingQuestionnaire.id}`, {
        method: "PATCH",
        headers: { "accept": "application/json" },
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
        toast(errorData.detail || "Failed to update questionnaire. Please try again.", "error");
      }
    } catch (err: any) {
      toast("Network error. Please check your connection and try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuestionnaire = async () => {
    if (!createForm.name) {
      toast("Please provide a questionnaire name.", "error");
      return;
    }
    if (createForm.inputMode === "file" && !createForm.file) {
      toast("Please upload a questionnaire file.", "error");
      return;
    }
    if (createForm.inputMode === "text" && !createForm.text.trim()) {
      toast("Please enter questionnaire text.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      formData.append("name", createForm.name);
      if (createForm.description) formData.append("description", createForm.description);
      formData.append("active", String(createForm.active));
      formData.append("is_redflag", String(createForm.is_redflag));

      let endpoint = "";
      if (createForm.inputMode === "file") {
        formData.append("file", createForm.file!);
        endpoint = `/api/v1/questionnaires/upload`;
      } else {
        formData.append("text", createForm.text);
        endpoint = `/api/v1/questionnaires/parse`;
      }

      const res = await apiFetch(endpoint, {
        method: "POST",
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
        toast(errorData.detail || "Failed to create questionnaire. Please try again.", "error");
      }
    } catch (err: any) {
      toast("Network error. Please check your connection and try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestionnaire = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    const questionnaire = questionnaires.find(q => q.id === id);
    if (!canModifyQuestionnaire(questionnaire)) {
      setDeleteConfirm(null);
      toast("Only super admins can delete global questionnaires.", "error");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/v1/questionnaires/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      if (res.ok) {
        toast(`"${name}" deleted successfully`, "success");
        fetchQuestionnaires();
        if (expandedId === id) {
          setExpandedId(null);
          router.push('/questionnaires', { scroll: false });
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast(errorData.detail || "Failed to delete questionnaire", "error");
      }
    } catch (err: any) {
      setDeleteConfirm(null);
      toast("Network error. Please check your connection and try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const getQuestionnaireFileName = (q: Questionnaire, extension: "pdf" | "doc") =>
    `${q.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

  const escapeHtml = (value: string | number | boolean | null | undefined) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const downloadPDF = async (q: Questionnaire) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Fill background on current page
    const fillBg = () => {
      doc.setFillColor(10, 25, 49);
      doc.rect(0, 0, 210, 297, 'F');
    };

    // Fill bg on first page
    fillBg();

    const addPage = () => {
      doc.addPage();
      fillBg(); // fill dark bg on every new page
      y = 20;
    };
    const checkY = (needed: number) => { if (y + needed > 275) addPage(); };

    // Header
    doc.setFillColor(26, 61, 99);
    doc.roundedRect(margin, y, contentW, 22, 4, 4, 'F');
    doc.setTextColor(242, 246, 253);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(q.name, margin + 6, y + 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(179, 207, 229);
    if (q.description) doc.text(q.description, margin + 6, y + 16);
    y += 30;

    // Meta row
    doc.setFontSize(7);
    doc.setTextColor(100, 150, 200);
    const totalQ = q.schema_definition?.sections?.reduce((a, s) => a + (s.questions?.length || 0), 0) || 0;
    doc.text(`v${q.version}  •  ${q.active ? 'Active' : 'Archived'}  •  ${q.is_redflag ? 'Red Flag  •  ' : ''}${q.schema_definition?.sections?.length || 0} sections  •  ${totalQ} questions`, margin, y);
    y += 10;

    // Sections
    const sections = q.schema_definition?.sections || [];
    for (const section of sections) {
      checkY(14);
      // Section heading
      doc.setFillColor(30, 65, 110);
      doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F');
      doc.setTextColor(242, 246, 253);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title?.toUpperCase() || 'SECTION', margin + 4, y + 7);
      const qCount = `${section.questions?.length || 0} questions`;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(179, 207, 229);
      doc.text(qCount, pageW - margin - doc.getTextWidth(qCount) - 4, y + 7);
      y += 14;

      // Questions
      for (let i = 0; i < (section.questions || []).length; i++) {
        const question = section.questions[i];
        // Estimate height needed
        const lines = doc.splitTextToSize(question.text, contentW - 28);
        const qHeight = Math.max(14, lines.length * 5 + 8);
        checkY(qHeight);

        // Card bg
        doc.setFillColor(18, 40, 75);
        doc.roundedRect(margin, y, contentW, qHeight, 2, 2, 'F');

        // Weight badge
        doc.setFillColor(74, 127, 167);
        doc.roundedRect(margin + 3, y + (qHeight / 2) - 4, 12, 8, 1.5, 1.5, 'F');
        doc.setTextColor(242, 246, 253);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(String(question.weight || 0), margin + 9, y + (qHeight / 2) + 1.5, { align: 'center' });

        // Question text
        doc.setTextColor(230, 240, 255);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(lines, margin + 18, y + 6);

        // Type + required badges
        const badgeY = y + qHeight - 5;
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(130, 170, 210);
        doc.text((question.type || 'yes_no').replace(/_/g, ' ').toUpperCase(), margin + 18, badgeY);
        if (question.required) {
          doc.setTextColor(252, 110, 110);
          doc.text('REQUIRED', margin + 18 + doc.getTextWidth((question.type || '').replace(/_/g, ' ').toUpperCase()) + 4, badgeY);
        }

        y += qHeight + 3;
      }
      y += 4;
    }

    // Footer on each page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(7);
      doc.setTextColor(80, 110, 150);
      doc.text(`${q.name}  •  Page ${p} of ${pageCount}  •  Generated by CallBlick`, margin, 292);
    }

    doc.save(getQuestionnaireFileName(q, "pdf"));
    toast(`"${q.name}" downloaded as PDF`, 'success');
  };

  const downloadDOC = (q: Questionnaire) => {
    const totalQuestions = q.schema_definition?.sections?.reduce((acc, section) => acc + (section.questions?.length || 0), 0) || 0;
    const sections = q.schema_definition?.sections || [];
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(q.name)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #102033; line-height: 1.45; }
            h1 { font-size: 24px; margin-bottom: 6px; }
            h2 { font-size: 18px; margin: 24px 0 10px; border-bottom: 1px solid #ccd6e2; padding-bottom: 6px; }
            .meta { color: #54677d; font-size: 12px; margin-bottom: 18px; }
            .question { border: 1px solid #d7e0ea; border-radius: 8px; padding: 12px; margin: 10px 0; }
            .question-title { font-weight: 700; margin-bottom: 8px; }
            .badge { display: inline-block; border: 1px solid #b8c5d3; border-radius: 4px; padding: 2px 6px; margin-right: 6px; font-size: 10px; text-transform: uppercase; color: #40566f; }
            .required { border-color: #d35b5b; color: #b72f2f; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(q.name)}</h1>
          ${q.description ? `<p>${escapeHtml(q.description)}</p>` : ""}
          <p class="meta">
            Version ${escapeHtml(q.version)} | ${q.active ? "Active" : "Archived"}${q.is_redflag ? " | Red Flag" : ""}${q.is_global ? " | Global" : ""} |
            ${sections.length} sections | ${totalQuestions} questions
          </p>
          ${sections.map(section => `
            <h2>${escapeHtml(section.title || "Section")}</h2>
            ${(section.questions || []).map(question => `
              <div class="question">
                <div class="question-title">${escapeHtml(question.text)}</div>
                <span class="badge">Weight ${escapeHtml(question.weight || 0)}</span>
                <span class="badge">${escapeHtml((question.type || "yes_no").replace(/_/g, " "))}</span>
                ${question.answer_type ? `<span class="badge">Answer ${escapeHtml(question.answer_type)}</span>` : ""}
                ${question.required ? `<span class="badge required">Required</span>` : ""}
              </div>
            `).join("")}
          `).join("")}
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getQuestionnaireFileName(q, "doc");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`"${q.name}" downloaded as DOC`, "success");
  };

  const handleDownload = async (q: Questionnaire, format: "pdf" | "doc") => {
    setDownloadFormatFor(null);
    if (format === "pdf") {
      await downloadPDF(q);
    } else {
      downloadDOC(q);
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

        {isAdminOrManager && (
          <div className="flex items-center gap-3">
            <Tooltip content={tt("uploadSchema")} placement="bottom">
              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-blue-950/25 glow text-[#B3CFE5] hover:text-[#F6FAFD] border border-blue-400/15 hover:border-[#4A7FA7]/50 rounded-2xl font-bold text-sm uppercase tracking-widest transition-colors hover:opacity-90 active:scale-[0.98]">
                <Upload className="w-5 h-5" />
                {t('uploadSchema')}
              </button>
            </Tooltip>
            <Tooltip content={tt("createSchema")} placement="bottom">
              <button onClick={handleStartCreate} className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-colors hover:opacity-90 active:scale-[0.98]">
                <Plus className="w-5 h-5" />
                {t('createSchema')}
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B3CFE5] group-focus-within:text-[#4A7FA7] transition-colors" />
        <input
          type="text"
          placeholder={t('filterSchemaPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 glass-card rounded-[1.25rem] pl-16 pr-6 text-[#F6FAFD] font-bold tracking-tight placeholder:text-[#B3CFE5] outline-none focus:border-[#4A7FA7] transition-colors"
        />
      </div>

      {/* Create New Questionnaire Inline */}
      {isCreatingNew && (
        <div className="space-y-6 p-8 bg-blue-950/25 glow border border-blue-400/22 rounded-[2rem] animate-in fade-in duration-150 duration-150">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">{t('createNew')}</h3>
                <p className="text-sm font-semibold text-[#B3CFE5] mt-1">{t('createSubtitle')}</p>
              </div>
            </div>
          </div>

          {/* Metadata Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-black/25 rounded-2xl border border-blue-400/10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{t('nameLabel')}</label>
              <input
                type="text"
                value={newQuestionnaire.name}
                onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, name: e.target.value })}
                placeholder={t('namePlaceholder')}
                className="w-full h-12 glass-card rounded-xl px-4 text-sm font-semibold text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{t('descriptionLabel')}</label>
              <input
                type="text"
                value={newQuestionnaire.description}
                onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
                className="w-full h-12 glass-card rounded-xl px-4 text-sm font-semibold text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
              <input
                type="checkbox"
                id="create_active"
                checked={newQuestionnaire.active}
                onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, active: e.target.checked })}
                className="w-5 h-5 rounded border-blue-400/15 text-[#4A7FA7]"
              />
              <Tooltip content={tt("activeCheckbox")} placement="top">
                <label htmlFor="create_active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('activeLabel')}</label>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3 p-4 glass-card rounded-xl">
              <input
                type="checkbox"
                id="create_redflag"
                checked={newQuestionnaire.is_redflag}
                onChange={(e) => setNewQuestionnaire({ ...newQuestionnaire, is_redflag: e.target.checked })}
                className="w-5 h-5 rounded border-red-500/30 text-red-500"
              />
              <Tooltip content={tt("redFlagCheckbox")} placement="top">
                <label htmlFor="create_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('redFlagLabel')}</label>
              </Tooltip>
            </div>
          </div>

          {/* Inline Editor */}
          <InlineQuestionnaireEditor
            sections={newQuestionnaire.sections}
            onSave={handleSaveNewQuestionnaire}
            onCancel={handleCancelCreate}
          />
        </div>
      )}

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
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest">{t('retryConnection')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
             <FileSearch className="w-16 h-16 text-[#4A7FA7] mx-auto" />
             <p className="text-[#B3CFE5] font-bold">{t('noResults')}</p>
          </div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className={cn(
                "group bg-blue-950/25 glow border rounded-[2rem] transition-colors duration-150 overflow-hidden",
                expandedId === q.id ? "border-[#4A7FA7]/50" : "border-blue-400/15 hover:border-blue-400/22"
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
                      q.active ? "bg-[#4A7FA7]/20 text-[#4A7FA7] border border-blue-400/15" : "bg-blue-950/18 text-[#B3CFE5]"
                    )}>
                      {q.active ? t('versionActive', { version: q.version }) : t('versionArchived', { version: q.version })}
                    </span>
                    {q.is_redflag && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                        {t('redFlagBadge')}
                      </span>
                    )}
                    {q.is_global && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        Global
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
                  <Tooltip content="Choose PDF or DOC download format" placement="top">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDownloadFormatFor(q); }}
                      className="w-10 h-10 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 flex items-center justify-center transition-colors border border-green-500/25"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  {canModifyQuestionnaire(q) ? (
                    <>
                      <Tooltip content={tt("editSchema")} placement="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditInline(q.id); }}
                          className="w-10 h-10 rounded-xl bg-[#4A7FA7]/20 hover:bg-[#4A7FA7]/30 text-[#4A7FA7] flex items-center justify-center transition-colors border border-blue-400/15"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content={tt("deleteSchema")} placement="top">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: q.id, name: q.name }); }}
                          className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors border border-red-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </>
                  ) : isAdminOrManager && q.is_global ? (
                    <Tooltip content="Only super admins can edit global questionnaires" placement="top">
                      <div className="px-3 py-2 rounded-xl bg-purple-500/10 text-purple-200/70 border border-purple-400/20 text-[10px] font-black uppercase tracking-widest">
                        Super Admin Only
                      </div>
                    </Tooltip>
                  ) : null}
                  <Tooltip content={expandedId === q.id ? tt("collapseSchema") : tt("expandSchema")} placement="top">
                    <div
                      onClick={() => {
                        const newExpandedId = expandedId === q.id ? null : q.id;
                        setExpandedId(newExpandedId);
                        if (newExpandedId) { router.push(`/questionnaires?id=${newExpandedId}`, { scroll: false }); }
                        else { router.push('/questionnaires', { scroll: false }); }
                      }}
                      className="w-12 h-12 rounded-2xl bg-blue-950/18 flex items-center justify-center text-[#4A7FA7] hover:bg-gradient-to-r hover:from-[#4A7FA7] hover:to-[#1A3D63] hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                      {expandedId === q.id ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                    </div>
                  </Tooltip>
                </div>
              </div>

              {expandedId === q.id && (
                <div className="px-8 pb-8 space-y-8">
                   <div className="h-px bg-[#4A7FA7]/30" />

                   {editingQuestionnaireId === q.id && canModifyQuestionnaire(q) ? (
                     <InlineQuestionnaireEditor
                       sections={q.schema_definition?.sections || []}
                       onSave={(sections) => handleSaveInlineEdit(q.id, sections)}
                       onCancel={handleCancelInlineEdit}
                     />
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {q.schema_definition?.sections?.map((section) => (
                       <div key={section.section_id} className="bg-blue-950/18 rounded-3xl p-8 space-y-6 border border-blue-400/15">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-black uppercase tracking-widest text-[#F6FAFD] flex items-center gap-2">
                              <Layers className="w-4 h-4 opacity-60" /> {section.title}
                            </h4>
                            <span className="text-[10px] font-bold text-[#B3CFE5]">{section.questions?.length || 0} items</span>
                          </div>

                          <div className="space-y-3">
                            {section.questions?.map((question) => (
                              <div key={question.question_id} className="bg-blue-950/25 p-4 rounded-2xl border border-blue-400/10 space-y-3 group/q">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-lg bg-[#4A7FA7]/20 flex items-center justify-center shrink-0 mt-0.5">
                                     <span className="text-[10px] font-black text-[#4A7FA7]">{question.weight}</span>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <p className="text-sm font-bold text-[#F6FAFD] leading-tight">{question.text}</p>
                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                      <Tooltip content="Question Type — the UI input style used in the form" placement="top">
                                        <span className="flex items-center gap-1 cursor-help">
                                          <span className="text-[8px] font-black uppercase tracking-wider text-[#B3CFE5]/60">Q Type</span>
                                          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-blue-950/40 text-[#B3CFE5] border border-blue-400/15">
                                            {question.type.replace(/_/g, " ")}
                                          </span>
                                        </span>
                                      </Tooltip>
                                      {question.answer_type && (
                                        <Tooltip content="Answer Type — constrains how the AI must format its answer for this question" placement="top">
                                          <span className="flex items-center gap-1 cursor-help">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-[#B3CFE5]/60">Ans Type</span>
                                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-[#4A7FA7]/20 text-[#4A7FA7] border border-[#4A7FA7]/25">
                                              {question.answer_type.replace(/_/g, " ")}
                                            </span>
                                          </span>
                                        </Tooltip>
                                      )}
                                      {question.required && (
                                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {Array.isArray(question.options) && question.options.length > 0 && (
                                  <div className="pl-9 space-y-1.5">
                                    <div className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5] mb-2">Options ({question.options.length}):</div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {question.options.map((option, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 rounded-md glass text-[10px] font-semibold text-[#B3CFE5]"
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
                   )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {mounted && isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/50 animate-in fade-in duration-150 duration-150">
           <div className="bg-[#1A3D63]/95 glow w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border border-blue-400/15 overflow-hidden animate-in fade-in duration-150 duration-150 flex flex-col">
              <div className="p-8 border-b border-blue-400/15 bg-blue-950/18 flex items-center justify-between shrink-0">
                 <div>
                    <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight">{t('modalCreateTitle')}</h3>
                    <p className="text-sm font-semibold text-[#B3CFE5] mt-1">{t('modalCreateSubtitle')}</p>
                 </div>
                 <button onClick={() => {
                   setIsCreateModalOpen(false);
                   setCreateForm({ name: "", description: "", active: true, is_redflag: false, inputMode: "file", file: null, text: "" });
                 }} className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-colors text-[#B3CFE5]">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto flex-1">
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('schemaNameRequired')}</label>
                     <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g. Sales Discovery Audit"
                      className="w-full h-14 glass rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-semibold placeholder:text-[#B3CFE5]/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('descriptionLabel')}</label>
                     <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="What does this schema evaluate?"
                      rows={2}
                      className="w-full glass rounded-xl px-4 py-3 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-medium placeholder:text-[#B3CFE5]/50 resize-none"
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('statusLabel')}</label>
                       <div className="flex items-center gap-3 p-4 glass rounded-xl">
                         <input
                           type="checkbox"
                           id="active"
                           checked={createForm.active}
                           onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })}
                           className="w-5 h-5 rounded border-blue-400/15 text-[#4A7FA7]"
                         />
                         <Tooltip content={tt("activeCheckbox")} placement="right">
                           <label htmlFor="active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('activeLabel')}</label>
                         </Tooltip>
                       </div>
                     </div>

                     <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('typeLabel')}</label>
                       <div className="flex items-center gap-3 p-4 glass rounded-xl">
                         <input
                           type="checkbox"
                           id="is_redflag"
                           checked={createForm.is_redflag}
                           onChange={(e) => setCreateForm({ ...createForm, is_redflag: e.target.checked })}
                           className="w-5 h-5 rounded border-blue-400/15 text-red-500"
                         />
                         <Tooltip content={tt("redFlagCheckbox")} placement="right">
                           <label htmlFor="is_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('redFlagLabel')}</label>
                         </Tooltip>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('inputMethodRequired')}</label>
                   <div className="flex p-1.5 bg-blue-950/18 rounded-xl border border-blue-400/10">
                     <button
                       type="button"
                       onClick={() => setCreateForm({ ...createForm, inputMode: "file" })}
                       className={cn(
                         "flex-1 py-3 rounded-lg text-sm font-extrabold transition-colors",
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
                         "flex-1 py-3 rounded-lg text-sm font-extrabold transition-colors",
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
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('uploadDocLabel')}</label>
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
                       className="w-full h-24 border-2 border-dashed border-blue-400/15 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-950/18 transition-colors group"
                     >
                       <div className="w-12 h-12 rounded-xl bg-blue-950/18 group-hover:bg-gradient-to-r group-hover:from-[#4A7FA7] group-hover:to-[#1A3D63] flex items-center justify-center text-[#4A7FA7] group-hover:text-white transition-colors">
                         <Upload className="w-6 h-6" />
                       </div>
                       <span className="text-sm font-bold text-[#B3CFE5]">
                         {createForm.file ? createForm.file.name : t('uploadDocHint')}
                       </span>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('textLabel')}</label>
                     <textarea
                       value={createForm.text}
                       onChange={(e) => setCreateForm({ ...createForm, text: e.target.value })}
                       placeholder={`${t('textPlaceholder')}\n\nExample:\nSection 1: Compliance\nQ1: Did the agent verify customer identity?\nQ2: Was data protection mentioned?`}
                       rows={12}
                       className="w-full glass rounded-xl p-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-medium text-sm resize-none placeholder:text-[#B3CFE5]/40"
                     />
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-blue-400/15 bg-blue-950/18 shrink-0">
                <button
                  onClick={handleCreateQuestionnaire}
                  disabled={
                    isSubmitting ||
                    !createForm.name ||
                    (createForm.inputMode === "file" && !createForm.file) ||
                    (createForm.inputMode === "text" && !createForm.text.trim())
                  }
                  className="w-full h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {t('createButton')}</>}
                </button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {isEditModalOpen && editingQuestionnaire && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/50 animate-in fade-in duration-150 duration-150">
           <div className="bg-[#1A3D63]/95 glow w-full max-w-xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-blue-400/15 overflow-hidden animate-in fade-in duration-150 duration-150">
              <div className="p-6 md:p-8 border-b border-blue-400/15 bg-blue-950/18 flex items-center justify-between flex-shrink-0">
                 <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl md:text-2xl font-[850] text-[#F6FAFD] tracking-tight">{t('modalEditTitle')}</h3>
                    <p className="text-xs md:text-sm font-semibold text-[#B3CFE5] mt-1 truncate">{t('modalEditSubtitle')}</p>
                 </div>
                 <button onClick={() => {
                   setIsEditModalOpen(false);
                   setEditingQuestionnaire(null);
                 }} className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-colors text-[#B3CFE5] flex-shrink-0" title="Close edit dialog">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('schemaNameRequired')}</label>
                   <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="e.g. Sales Discovery Audit"
                    className="w-full h-12 md:h-14 glass rounded-xl px-4 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-semibold placeholder:text-[#B3CFE5]/50"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('descriptionLabel')}</label>
                   <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="What does this schema evaluate?"
                    rows={2}
                    className="w-full glass rounded-xl px-4 py-3 outline-none focus:border-[#4A7FA7] transition-colors text-[#F6FAFD] font-medium placeholder:text-[#B3CFE5]/50 resize-none"
                   />
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('statusLabel')}</label>
                     <div className="flex items-center gap-3 p-3 md:p-4 glass rounded-xl">
                       <input
                         type="checkbox"
                         id="edit_active"
                         checked={editForm.active}
                         onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                         className="w-5 h-5 rounded border-blue-400/15 text-[#4A7FA7]"
                       />
                       <Tooltip content={tt("activeCheckbox")} placement="right">
                         <label htmlFor="edit_active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('activeLabel')}</label>
                       </Tooltip>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B3CFE5]">{t('typeLabel')}</label>
                     <div className="flex items-center gap-3 p-3 md:p-4 glass rounded-xl">
                       <input
                         type="checkbox"
                         id="edit_is_redflag"
                         checked={editForm.is_redflag}
                         onChange={(e) => setEditForm({ ...editForm, is_redflag: e.target.checked })}
                         className="w-5 h-5 rounded border-blue-400/15 text-red-500"
                       />
                       <Tooltip content={tt("redFlagCheckbox")} placement="right">
                         <label htmlFor="edit_is_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">{t('redFlagLabel')}</label>
                       </Tooltip>
                     </div>
                   </div>
                 </div>
              </div>

              <div className="p-4 md:p-6 border-t border-blue-400/15 bg-blue-950/18 flex-shrink-0">
                <button onClick={handleUpdateQuestionnaire} disabled={isSubmitting || !editForm.name} className="w-full h-12 md:h-14 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-colors" title="Save changes to questionnaire">
                   {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> {t('updateButton')}</>}
                </button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Download Format Modal */}
      {mounted && downloadFormatFor && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0D1F3C] border border-blue-400/20 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-blue-400/12 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-[#F6FAFD] tracking-tight">Download Questionnaire</h3>
                <p className="text-sm text-[#B3CFE5] font-semibold mt-1">
                  Choose a format for <span className="text-[#F6FAFD]">{downloadFormatFor.name}</span>.
                </p>
              </div>
              <button
                onClick={() => setDownloadFormatFor(null)}
                className="w-9 h-9 rounded-xl bg-blue-950/30 hover:bg-blue-950/50 text-[#B3CFE5] hover:text-[#F6FAFD] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleDownload(downloadFormatFor, "pdf")}
                className="h-28 rounded-2xl bg-green-500/12 hover:bg-green-500/20 border border-green-500/25 text-left p-5 transition-colors group"
              >
                <Download className="w-6 h-6 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-black text-[#F6FAFD] uppercase tracking-widest">PDF</p>
                <p className="text-xs font-semibold text-[#B3CFE5] mt-1">Printable document</p>
              </button>
              <button
                onClick={() => handleDownload(downloadFormatFor, "doc")}
                className="h-28 rounded-2xl bg-[#4A7FA7]/15 hover:bg-[#4A7FA7]/25 border border-blue-400/20 text-left p-5 transition-colors group"
              >
                <FileText className="w-6 h-6 text-[#4A7FA7] mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-black text-[#F6FAFD] uppercase tracking-widest">DOC</p>
                <p className="text-xs font-semibold text-[#B3CFE5] mt-1">Editable Word file</p>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirm Modal */}
      {mounted && deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#0D1F3C] border border-red-500/20 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              </div>
              <div>
                <h3 className="text-base font-black text-[#F6FAFD] tracking-tight">Delete Questionnaire</h3>
                <p className="text-xs text-red-400 font-semibold mt-0.5">This action cannot be undone</p>
                <p className="text-sm text-[#B3CFE5] mt-3 leading-relaxed">
                  Are you sure you want to delete <span className="text-[#F6FAFD] font-bold">"{deleteConfirm.name}"</span>? All associated data will be permanently removed.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 h-11 bg-blue-950/40 hover:bg-blue-950/60 text-[#B3CFE5] hover:text-[#F6FAFD] rounded-xl font-bold text-sm uppercase tracking-wider transition-colors border border-blue-400/12 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestionnaire}
                disabled={isDeleting}
                className="flex-1 h-11 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Deleting...</>
                  : "Delete"
                }
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
