"use client";

import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Layers,
  HelpCircle,
  AlertCircle,
  Scale,
  List,
  ListChecks,
  Type,
  CheckSquare,
  ArrowUpDown,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionOption {
  min?: number;
  max?: number;
  labels?: Record<string, string>;
}

interface Question {
  question_id: string;
  text: string;
  type: "yes_no" | "single_choice" | "multi_choice" | "scale" | "text";
  required: boolean;
  weight: number;
  options?: string[] | QuestionOption;
  depends_on?: string | null;
}

interface Section {
  section_id: string;
  title: string;
  questions: Question[];
}

interface QuestionnaireSchema {
  name: string;
  description: string;
  active: boolean;
  is_redflag: boolean;
  schema_definition: {
    sections: Section[];
  };
}

interface QuestionnaireEditorProps {
  questionnaire: QuestionnaireSchema | null;
  questionnaireId?: string;
  onClose: () => void;
  onSave: (data: QuestionnaireSchema) => Promise<void>;
}

const QUESTION_TYPES = [
  { value: "yes_no", label: "Yes/No", icon: CheckSquare, description: "Simple yes or no answer" },
  { value: "single_choice", label: "Single Choice", icon: List, description: "Select one option from a list" },
  { value: "multi_choice", label: "Multiple Choice", icon: ListChecks, description: "Select multiple options" },
  { value: "scale", label: "Scale", icon: Scale, description: "Rating scale (1-5, 1-10, etc.)" },
  { value: "text", label: "Text", icon: Type, description: "Free text response" }
];

export function QuestionnaireEditor({ questionnaire, questionnaireId, onClose, onSave }: QuestionnaireEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [isRedflag, setIsRedflag] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  // Editing state
  const [editingQuestion, setEditingQuestion] = useState<{
    sectionId: string;
    questionIndex: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (questionnaire) {
      setName(questionnaire.name);
      setDescription(questionnaire.description);
      setActive(questionnaire.active);
      setIsRedflag(questionnaire.is_redflag);
      setSections(questionnaire.schema_definition.sections || []);
      // Expand all sections by default
      const allSectionIds = new Set((questionnaire.schema_definition.sections || []).map(s => s.section_id));
      setExpandedSections(allSectionIds);
    }
  }, [questionnaire]);

  const addSection = () => {
    const newSectionId = `section_${Date.now()}`;
    const newSection: Section = {
      section_id: newSectionId,
      title: "New Section",
      questions: []
    };
    setSections([...sections, newSection]);
    setExpandedSections(new Set([...expandedSections, newSectionId]));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.section_id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm("Delete this section and all its questions?")) return;
    setSections(sections.filter(s => s.section_id !== sectionId));
    const newExpanded = new Set(expandedSections);
    newExpanded.delete(sectionId);
    setExpandedSections(newExpanded);
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    const newSectionId = `section_${Date.now()}`;
    const duplicatedSection: Section = {
      ...section,
      section_id: newSectionId,
      title: `${section.title} (Copy)`,
      questions: section.questions.map((q, idx) => ({
        ...q,
        question_id: `${newSectionId}_q${idx + 1}`
      }))
    };

    setSections([...sections, duplicatedSection]);
    setExpandedSections(new Set([...expandedSections, newSectionId]));
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    setSections(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };

  const addQuestion = (sectionId: string) => {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    const newQuestion: Question = {
      question_id: `${sectionId}_q${section.questions.length + 1}`,
      text: "New question",
      type: "yes_no",
      required: false,
      weight: 10,
      options: [],
      depends_on: null
    };

    updateSection(sectionId, {
      questions: [...section.questions, newQuestion]
    });
  };

  const updateQuestion = (sectionId: string, questionIndex: number, updates: Partial<Question>) => {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    const updatedQuestions = section.questions.map((q, idx) =>
      idx === questionIndex ? { ...q, ...updates } : q
    );

    updateSection(sectionId, { questions: updatedQuestions });
  };

  const deleteQuestion = (sectionId: string, questionIndex: number) => {
    if (!confirm("Delete this question?")) return;
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      questions: section.questions.filter((_, idx) => idx !== questionIndex)
    });
  };

  const duplicateQuestion = (sectionId: string, questionIndex: number) => {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    const question = section.questions[questionIndex];
    const newQuestion: Question = {
      ...question,
      question_id: `${sectionId}_q${section.questions.length + 1}`,
      text: `${question.text} (Copy)`
    };

    updateSection(sectionId, {
      questions: [...section.questions, newQuestion]
    });
  };

  const moveQuestionUp = (sectionId: string, questionIndex: number) => {
    if (questionIndex === 0) return;
    const section = sections.find(s => s.section_id === sectionId);
    if (!section) return;

    const newQuestions = [...section.questions];
    [newQuestions[questionIndex - 1], newQuestions[questionIndex]] =
      [newQuestions[questionIndex], newQuestions[questionIndex - 1]];

    updateSection(sectionId, { questions: newQuestions });
  };

  const moveQuestionDown = (sectionId: string, questionIndex: number) => {
    const section = sections.find(s => s.section_id === sectionId);
    if (!section || questionIndex === section.questions.length - 1) return;

    const newQuestions = [...section.questions];
    [newQuestions[questionIndex], newQuestions[questionIndex + 1]] =
      [newQuestions[questionIndex + 1], newQuestions[questionIndex]];

    updateSection(sectionId, { questions: newQuestions });
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please provide a questionnaire name.");
      return;
    }

    if (sections.length === 0) {
      alert("Please add at least one section.");
      return;
    }

    // Validate all questions have text
    for (const section of sections) {
      for (const question of section.questions) {
        if (!question.text.trim()) {
          alert(`Please provide text for all questions in section "${section.title}".`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        active,
        is_redflag: isRedflag,
        schema_definition: { sections }
      });
    } catch (error) {
      console.error("Failed to save questionnaire:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalQuestions = () => {
    return sections.reduce((sum, section) => sum + section.questions.length, 0);
  };

  const getTotalWeight = () => {
    return sections.reduce((sum, section) =>
      sum + section.questions.reduce((qSum, q) => qSum + q.weight, 0), 0
    );
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 overflow-hidden">
      <div className="bg-[#0A1931] w-full max-w-7xl h-[95vh] rounded-3xl shadow-2xl border border-[#4A7FA7]/30 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#4A7FA7]/30 bg-[#1A3D63]/60 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-2xl font-[850] text-[#F6FAFD] tracking-tight flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#4A7FA7]" />
              {questionnaireId ? "Edit Questionnaire" : "Create Questionnaire"}
            </h3>
            <p className="text-sm font-semibold text-[#B3CFE5] mt-1">
              Visual schema builder • {sections.length} sections • {getTotalQuestions()} questions • Total weight: {getTotalWeight()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5] flex-shrink-0"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Metadata */}
          <div className="w-80 border-r border-[#4A7FA7]/30 bg-[#1A3D63]/40 p-6 overflow-y-auto space-y-6">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5] mb-4 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Metadata
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sales Discovery QA"
                    className="w-full h-10 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-lg px-3 text-sm font-semibold text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this evaluate?"
                    rows={3}
                    className="w-full bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-lg px-3 py-2 text-sm font-medium text-[#F6FAFD] placeholder:text-[#B3CFE5]/50 outline-none focus:border-[#4A7FA7] transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-lg">
                    <input
                      type="checkbox"
                      id="editor_active"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded border-[#4A7FA7]/30 text-[#4A7FA7]"
                    />
                    <label htmlFor="editor_active" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                      Active
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-lg">
                    <input
                      type="checkbox"
                      id="editor_redflag"
                      checked={isRedflag}
                      onChange={(e) => setIsRedflag(e.target.checked)}
                      className="w-4 h-4 rounded border-red-500/30 text-red-500"
                    />
                    <label htmlFor="editor_redflag" className="text-sm font-bold text-[#F6FAFD] cursor-pointer">
                      Red Flag
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#4A7FA7]/20">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#B3CFE5] mb-4">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-[#0A1931]/60 rounded-lg">
                  <span className="text-xs font-bold text-[#B3CFE5]">Sections</span>
                  <span className="text-sm font-black text-[#F6FAFD]">{sections.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A1931]/60 rounded-lg">
                  <span className="text-xs font-bold text-[#B3CFE5]">Questions</span>
                  <span className="text-sm font-black text-[#F6FAFD]">{getTotalQuestions()}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A1931]/60 rounded-lg">
                  <span className="text-xs font-bold text-[#B3CFE5]">Total Weight</span>
                  <span className="text-sm font-black text-[#F6FAFD]">{getTotalWeight()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Sections & Questions */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#B3CFE5]">
                Sections & Questions
              </h4>
              <button
                onClick={addSection}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:opacity-90 shadow-lg shadow-[#4A7FA7]/20"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="p-16 text-center space-y-4 bg-[#1A3D63]/40 rounded-2xl border border-[#4A7FA7]/20">
                <Layers className="w-12 h-12 text-[#4A7FA7] mx-auto opacity-50" />
                <p className="text-[#B3CFE5] font-semibold">No sections yet. Add your first section to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <SectionEditor
                    key={section.section_id}
                    section={section}
                    sectionIndex={sectionIndex}
                    isExpanded={expandedSections.has(section.section_id)}
                    onToggle={() => toggleSection(section.section_id)}
                    onUpdate={(updates) => updateSection(section.section_id, updates)}
                    onDelete={() => deleteSection(section.section_id)}
                    onDuplicate={() => duplicateSection(section.section_id)}
                    onMoveUp={() => moveSectionUp(sectionIndex)}
                    onMoveDown={() => moveSectionDown(sectionIndex)}
                    canMoveUp={sectionIndex > 0}
                    canMoveDown={sectionIndex < sections.length - 1}
                    onAddQuestion={() => addQuestion(section.section_id)}
                    onUpdateQuestion={(qIdx, updates) => updateQuestion(section.section_id, qIdx, updates)}
                    onDeleteQuestion={(qIdx) => deleteQuestion(section.section_id, qIdx)}
                    onDuplicateQuestion={(qIdx) => duplicateQuestion(section.section_id, qIdx)}
                    onMoveQuestionUp={(qIdx) => moveQuestionUp(section.section_id, qIdx)}
                    onMoveQuestionDown={(qIdx) => moveQuestionDown(section.section_id, qIdx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#4A7FA7]/30 bg-[#1A3D63]/60 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#0A1931]/60 hover:bg-[#0A1931]/80 text-[#B3CFE5] rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || sections.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#4A7FA7]/20"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Questionnaire
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface SectionEditorProps {
  section: Section;
  sectionIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Section>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddQuestion: () => void;
  onUpdateQuestion: (questionIndex: number, updates: Partial<Question>) => void;
  onDeleteQuestion: (questionIndex: number) => void;
  onDuplicateQuestion: (questionIndex: number) => void;
  onMoveQuestionUp: (questionIndex: number) => void;
  onMoveQuestionDown: (questionIndex: number) => void;
}

function SectionEditor({
  section,
  sectionIndex,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown
}: SectionEditorProps) {
  return (
    <div className="bg-[#1A3D63]/60 border border-[#4A7FA7]/30 rounded-2xl overflow-hidden">
      {/* Section Header */}
      <div className="p-4 bg-[#1A3D63]/80 border-b border-[#4A7FA7]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full bg-transparent text-base font-black text-[#F6FAFD] outline-none placeholder:text-[#B3CFE5]/50"
              placeholder="Section title"
            />
          </div>

          <span className="text-xs font-bold text-[#B3CFE5] px-2 py-1 bg-[#0A1931]/60 rounded-md">
            {section.questions.length} Q
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                canMoveUp ? "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]" : "opacity-30 cursor-not-allowed text-[#B3CFE5]"
              )}
              title="Move section up"
            >
              <ArrowUpDown className="w-3.5 h-3.5 rotate-180" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                canMoveDown ? "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]" : "opacity-30 cursor-not-allowed text-[#B3CFE5]"
              )}
              title="Move section down"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDuplicate}
              className="w-7 h-7 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
              title="Duplicate section"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-red-400"
              title="Delete section"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {section.questions.map((question, questionIndex) => (
            <QuestionEditor
              key={question.question_id}
              question={question}
              questionIndex={questionIndex}
              onUpdate={(updates) => onUpdateQuestion(questionIndex, updates)}
              onDelete={() => onDeleteQuestion(questionIndex)}
              onDuplicate={() => onDuplicateQuestion(questionIndex)}
              onMoveUp={() => onMoveQuestionUp(questionIndex)}
              onMoveDown={() => onMoveQuestionDown(questionIndex)}
              canMoveUp={questionIndex > 0}
              canMoveDown={questionIndex < section.questions.length - 1}
            />
          ))}

          <button
            onClick={onAddQuestion}
            className="w-full py-3 border-2 border-dashed border-[#4A7FA7]/30 rounded-xl hover:bg-[#1A3D63]/40 transition-all flex items-center justify-center gap-2 text-[#B3CFE5] font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      )}
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

function QuestionEditor({
  question,
  questionIndex,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const questionType = QUESTION_TYPES.find(t => t.value === question.type);
  const Icon = questionType?.icon || HelpCircle;

  return (
    <div className="bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-xl overflow-hidden">
      {/* Question Header */}
      <div className="p-3 flex items-start gap-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-6 h-6 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5] flex-shrink-0 mt-0.5"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#4A7FA7]/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-[#4A7FA7]" />
            </div>
            <input
              type="text"
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="flex-1 bg-transparent text-sm font-semibold text-[#F6FAFD] outline-none placeholder:text-[#B3CFE5]/50"
              placeholder="Question text"
            />
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-2 pl-8">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#B3CFE5]">
                {questionType?.label}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
              <span className="text-[9px] font-bold text-[#B3CFE5]">Weight: {question.weight}</span>
              {question.required && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#4A7FA7]/30" />
                  <span className="text-[9px] font-bold uppercase text-red-400">Required</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
              canMoveUp ? "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]" : "opacity-30 cursor-not-allowed text-[#B3CFE5]"
            )}
            title="Move up"
          >
            <ArrowUpDown className="w-3 h-3 rotate-180" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
              canMoveDown ? "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]" : "opacity-30 cursor-not-allowed text-[#B3CFE5]"
            )}
            title="Move down"
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <button
            onClick={onDuplicate}
            className="w-6 h-6 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Question Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#4A7FA7]/10 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Type</label>
              <select
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as Question["type"] })}
                className="w-full h-9 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
              >
                {QUESTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Weight (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={question.weight}
                onChange={(e) => onUpdate({ weight: parseInt(e.target.value) || 0 })}
                className="w-full h-9 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg">
            <input
              type="checkbox"
              id={`required_${question.question_id}`}
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="w-4 h-4 rounded border-[#4A7FA7]/30 text-red-500"
            />
            <label htmlFor={`required_${question.question_id}`} className="text-xs font-bold text-[#F6FAFD] cursor-pointer">
              Required Question
            </label>
          </div>

          {(question.type === "single_choice" || question.type === "multi_choice") && (
            <ChoiceOptionsEditor
              options={Array.isArray(question.options) ? question.options : []}
              onChange={(newOptions) => onUpdate({ options: newOptions })}
            />
          )}

          {question.type === "scale" && (
            <ScaleOptionsEditor
              options={typeof question.options === 'object' && !Array.isArray(question.options) ? question.options : { min: 1, max: 5 }}
              onChange={(newOptions) => onUpdate({ options: newOptions })}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ChoiceOptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

function ChoiceOptionsEditor({ options, onChange }: ChoiceOptionsEditorProps) {
  const addOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Options</label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="flex-1 h-8 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
              placeholder={`Option ${index + 1}`}
            />
            <button
              onClick={() => removeOption(index)}
              className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="w-full h-8 border border-dashed border-[#4A7FA7]/30 rounded-lg hover:bg-[#1A3D63]/40 transition-all flex items-center justify-center gap-2 text-[#B3CFE5] font-bold text-xs"
        >
          <Plus className="w-3 h-3" />
          Add Option
        </button>
      </div>
    </div>
  );
}

interface ScaleOptionsEditorProps {
  options: QuestionOption;
  onChange: (options: QuestionOption) => void;
}

function ScaleOptionsEditor({ options, onChange }: ScaleOptionsEditorProps) {
  const updateLabel = (key: string, value: string) => {
    onChange({
      ...options,
      labels: {
        ...options.labels,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Scale Configuration</label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#B3CFE5]">Min</label>
          <input
            type="number"
            value={options.min || 1}
            onChange={(e) => onChange({ ...options, min: parseInt(e.target.value) || 1 })}
            className="w-full h-8 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#B3CFE5]">Max</label>
          <input
            type="number"
            value={options.max || 5}
            onChange={(e) => onChange({ ...options, max: parseInt(e.target.value) || 5 })}
            className="w-full h-8 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-bold text-[#B3CFE5]">Labels (Optional)</label>
        {[options.min?.toString() || "1", Math.floor(((options.min || 1) + (options.max || 5)) / 2).toString(), options.max?.toString() || "5"].map((key) => (
          <input
            key={key}
            type="text"
            value={options.labels?.[key] || ""}
            onChange={(e) => updateLabel(key, e.target.value)}
            placeholder={`Label for ${key}`}
            className="w-full h-8 bg-[#1A3D63]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all placeholder:text-[#B3CFE5]/50"
          />
        ))}
      </div>
    </div>
  );
}
