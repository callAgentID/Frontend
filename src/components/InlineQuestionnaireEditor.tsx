"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Layers,
  HelpCircle,
  Scale,
  List,
  ListChecks,
  Type,
  CheckSquare,
  ArrowUpDown,
  Copy,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionOption {
  min?: number;
  max?: number;
  labels?: Record<string, string>;
}

export interface Question {
  question_id: string;
  text: string;
  type: "yes_no" | "single_choice" | "multi_choice" | "scale" | "text";
  required: boolean;
  weight: number;
  options?: string[] | QuestionOption;
  depends_on?: string | null;
}

export interface Section {
  section_id: string;
  title: string;
  questions: Question[];
}

interface InlineQuestionnaireEditorProps {
  sections: Section[];
  onSave: (sections: Section[]) => Promise<void>;
  onCancel: () => void;
}

const QUESTION_TYPES = [
  { value: "yes_no", label: "Yes/No", icon: CheckSquare },
  { value: "single_choice", label: "Single Choice", icon: List },
  { value: "multi_choice", label: "Multiple Choice", icon: ListChecks },
  { value: "scale", label: "Scale", icon: Scale },
  { value: "text", label: "Text", icon: Type }
];

export function InlineQuestionnaireEditor({ sections: initialSections, onSave, onCancel }: InlineQuestionnaireEditorProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [isSaving, setIsSaving] = useState(false);

  const addSection = () => {
    const newSectionId = `section_${Date.now()}`;
    const newSection: Section = {
      section_id: newSectionId,
      title: "New Section",
      questions: []
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.section_id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm("Delete this section and all its questions?")) return;
    setSections(sections.filter(s => s.section_id !== sectionId));
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(sections);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Action Bar */}
      <div className="sticky top-0 z-20 bg-[#0A1931]/95 backdrop-blur-md border border-[#4A7FA7]/30 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A7FA7]/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#4A7FA7]" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#F6FAFD]">Editing Mode</h4>
            <p className="text-xs font-semibold text-[#B3CFE5]">
              {sections.length} sections • {sections.reduce((sum, s) => sum + s.questions.length, 0)} questions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addSection}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A3D63]/60 hover:bg-[#1A3D63]/80 text-[#B3CFE5] hover:text-[#F6FAFD] rounded-xl font-bold text-xs uppercase tracking-wider transition-all border border-[#4A7FA7]/30"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#1A3D63]/60 hover:bg-[#1A3D63]/80 text-[#B3CFE5] rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 shadow-lg shadow-[#4A7FA7]/20"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-[#1A3D63]/40 rounded-2xl border border-[#4A7FA7]/20">
          <Layers className="w-12 h-12 text-[#4A7FA7] mx-auto opacity-50" />
          <p className="text-[#B3CFE5] font-semibold">No sections yet. Add your first section to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <SectionEditor
              key={section.section_id}
              section={section}
              sectionIndex={sectionIndex}
              totalSections={sections.length}
              onUpdate={(updates) => updateSection(section.section_id, updates)}
              onDelete={() => deleteSection(section.section_id)}
              onDuplicate={() => duplicateSection(section.section_id)}
              onMoveUp={() => moveSectionUp(sectionIndex)}
              onMoveDown={() => moveSectionDown(sectionIndex)}
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
  );
}

interface SectionEditorProps {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  onUpdate: (updates: Partial<Section>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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
  totalSections,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown
}: SectionEditorProps) {
  return (
    <div className="bg-[#1A3D63]/60 border border-[#4A7FA7]/30 rounded-3xl overflow-hidden">
      {/* Section Header */}
      <div className="p-6 bg-[#1A3D63]/80 border-b border-[#4A7FA7]/20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-[#4A7FA7]/20 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-[#4A7FA7]" />
          </div>

          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="flex-1 bg-transparent text-lg font-black text-[#F6FAFD] outline-none placeholder:text-[#B3CFE5]/50 border-b border-transparent hover:border-[#4A7FA7]/30 focus:border-[#4A7FA7] transition-all pb-1"
            placeholder="Section title"
          />

          <span className="text-xs font-bold text-[#B3CFE5] px-3 py-1 bg-[#0A1931]/60 rounded-lg">
            {section.questions.length} {section.questions.length === 1 ? 'question' : 'questions'}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={sectionIndex === 0}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                sectionIndex === 0 ? "opacity-30 cursor-not-allowed text-[#B3CFE5]" : "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]"
              )}
              title="Move section up"
            >
              <ArrowUpDown className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={sectionIndex === totalSections - 1}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                sectionIndex === totalSections - 1 ? "opacity-30 cursor-not-allowed text-[#B3CFE5]" : "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]"
              )}
              title="Move section down"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={onDuplicate}
              className="w-8 h-8 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
              title="Duplicate section"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-red-400"
              title="Delete section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-4">
        {section.questions.map((question, questionIndex) => (
          <QuestionEditor
            key={question.question_id}
            question={question}
            questionIndex={questionIndex}
            totalQuestions={section.questions.length}
            onUpdate={(updates) => onUpdateQuestion(questionIndex, updates)}
            onDelete={() => onDeleteQuestion(questionIndex)}
            onDuplicate={() => onDuplicateQuestion(questionIndex)}
            onMoveUp={() => onMoveQuestionUp(questionIndex)}
            onMoveDown={() => onMoveQuestionDown(questionIndex)}
          />
        ))}

        <button
          onClick={onAddQuestion}
          className="w-full py-4 border-2 border-dashed border-[#4A7FA7]/30 rounded-2xl hover:bg-[#1A3D63]/40 hover:border-[#4A7FA7]/50 transition-all flex items-center justify-center gap-2 text-[#B3CFE5] hover:text-[#F6FAFD] font-bold text-sm group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Add Question
        </button>
      </div>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionEditor({
  question,
  questionIndex,
  totalQuestions,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown
}: QuestionEditorProps) {
  const questionType = QUESTION_TYPES.find(t => t.value === question.type);
  const Icon = questionType?.icon || HelpCircle;

  return (
    <div className="bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-2xl p-4 space-y-4 group/question hover:border-[#4A7FA7]/40 transition-all">
      {/* Question Header */}
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#4A7FA7]/20 flex items-center justify-center shrink-0 mt-1">
          <Icon className="w-4 h-4 text-[#4A7FA7]" />
        </div>

        <div className="flex-1 space-y-3">
          <textarea
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-[#F6FAFD] outline-none placeholder:text-[#B3CFE5]/50 border-b border-transparent hover:border-[#4A7FA7]/30 focus:border-[#4A7FA7] transition-all pb-1 resize-none min-h-[40px]"
            placeholder="Question text"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Type</label>
              <select
                value={question.type}
                onChange={(e) => onUpdate({ type: e.target.value as Question["type"], options: [] })}
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
                onChange={(e) => onUpdate({ weight: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
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

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={questionIndex === 0}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              questionIndex === 0 ? "opacity-30 cursor-not-allowed text-[#B3CFE5]" : "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]"
            )}
            title="Move up"
          >
            <ArrowUpDown className="w-3.5 h-3.5 rotate-180" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={questionIndex === totalQuestions - 1}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
              questionIndex === totalQuestions - 1 ? "opacity-30 cursor-not-allowed text-[#B3CFE5]" : "hover:bg-[#4A7FA7]/20 text-[#B3CFE5]"
            )}
            title="Move down"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
          <div className="h-px bg-[#4A7FA7]/20 my-1" />
          <button
            onClick={onDuplicate}
            className="w-7 h-7 rounded-lg hover:bg-[#4A7FA7]/20 flex items-center justify-center transition-all text-[#B3CFE5]"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all text-red-400"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
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
    <div className="space-y-2 p-3 bg-[#1A3D63]/40 rounded-lg border border-[#4A7FA7]/20">
      <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Options</label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="flex-1 h-8 bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-lg px-3 text-xs font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
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
    <div className="space-y-3 p-3 bg-[#1A3D63]/40 rounded-lg border border-[#4A7FA7]/20">
      <label className="text-[9px] font-black uppercase tracking-wider text-[#B3CFE5]">Scale Configuration</label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#B3CFE5]">Min</label>
          <input
            type="number"
            value={options.min || 1}
            onChange={(e) => onChange({ ...options, min: parseInt(e.target.value) || 1 })}
            className="w-full h-8 bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#B3CFE5]">Max</label>
          <input
            type="number"
            value={options.max || 5}
            onChange={(e) => onChange({ ...options, max: parseInt(e.target.value) || 5 })}
            className="w-full h-8 bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
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
            className="w-full h-8 bg-[#0A1931]/60 border border-[#4A7FA7]/20 rounded-lg px-2 text-xs font-medium text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all placeholder:text-[#B3CFE5]/50"
          />
        ))}
      </div>
    </div>
  );
}
