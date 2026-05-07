"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import {
  Filter,
  X,
  Search,
  Calendar,
  Tag,
  BarChart3,
  CheckCircle2,
  XCircle,
  Smile,
  Frown,
  Meh,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CallFilterParams {
  campaign_id?: string[];
  questionnaire_id?: string[];
  agent_id?: string[];
  customer_id?: string[];
  status?: string[];
  review_status?: string[];
  call_success?: boolean | null;
  min_score?: number;
  max_score?: number;
  language?: string;
  batch_id?: string;
  tag?: string[];
  search?: string;
  sentiment?: string;
  created_after?: string;
  created_before?: string;
}

interface CallFiltersProps {
  filters: CallFilterParams;
  onFiltersChange: (filters: CallFilterParams) => void;
  campaigns?: Array<{ id: string; name: string }>;
  questionnaires?: Array<{ id: string; title: string }>;
}

const STATUS_OPTIONS = [
  { value: "ready", label: "Ready" },
  { value: "queued", label: "Queued" },
  { value: "preprocessing", label: "Processing" },
  { value: "failed", label: "Failed" }
];

const REVIEW_STATUS_OPTIONS = [
  { value: "unreviewed", label: "Unreviewed" },
  { value: "reviewed", label: "Reviewed" },
  { value: "skipped", label: "Skipped" }
];

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive", icon: Smile, color: "text-green-600" },
  { value: "neutral", label: "Neutral", icon: Meh, color: "text-gray-600" },
  { value: "negative", label: "Negative", icon: Frown, color: "text-red-600" }
];

export function CallFilters({ filters, onFiltersChange, campaigns = [], questionnaires = [] }: CallFiltersProps) {
  const t = useTranslations('analytics');
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [tagInput, setTagInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Sync search input with external filter changes
  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  // Debounce search input with 500ms delay
  useEffect(() => {
    if (searchInput !== filters.search) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput.trim() || undefined });
      }
      setIsSearching(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchInput]);

  const toggleStatus = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const toggleReviewStatus = (status: string) => {
    const current = filters.review_status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, review_status: updated.length > 0 ? updated : undefined });
  };

  const toggleCampaign = (campaignId: string) => {
    const current = filters.campaign_id || [];
    const updated = current.includes(campaignId)
      ? current.filter(id => id !== campaignId)
      : [...current, campaignId];
    onFiltersChange({ ...filters, campaign_id: updated.length > 0 ? updated : undefined });
  };

  const toggleQuestionnaire = (questionnaireId: string) => {
    const current = filters.questionnaire_id || [];
    const updated = current.includes(questionnaireId)
      ? current.filter(id => id !== questionnaireId)
      : [...current, questionnaireId];
    onFiltersChange({ ...filters, questionnaire_id: updated.length > 0 ? updated : undefined });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const current = filters.tag || [];
      if (!current.includes(tagInput.trim())) {
        onFiltersChange({ ...filters, tag: [...current, tagInput.trim()] });
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const updated = (filters.tag || []).filter(t => t !== tag);
    onFiltersChange({ ...filters, tag: updated.length > 0 ? updated : undefined });
  };

  const setCallSuccess = (value: boolean | null) => {
    onFiltersChange({ ...filters, call_success: value === null ? undefined : value });
  };

  const setSentiment = (value: string | null) => {
    onFiltersChange({ ...filters, sentiment: value || undefined });
  };

  const setScoreRange = (min?: number, max?: number) => {
    onFiltersChange({
      ...filters,
      min_score: min,
      max_score: max
    });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setTagInput("");
    onFiltersChange({});
  };

  const activeFilterCount = Object.keys(filters).filter(key =>
    filters[key as keyof CallFilterParams] !== undefined &&
    (Array.isArray(filters[key as keyof CallFilterParams])
      ? (filters[key as keyof CallFilterParams] as any[]).length > 0
      : true)
  ).length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border",
            isOpen
              ? "bg-[#1F3A34] text-white border-[#1F3A34]"
              : "bg-white text-[#1F3A34] border-[#1f3a3410] hover:bg-[#1F3A3408]"
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">{t('filters')}</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-black">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="p-6 rounded-[2rem] bg-white border border-[#1f3a3410] space-y-6 shadow-lg">
          {/* Search */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2 flex items-center gap-2">
              <Search className={cn("w-3 h-3", isSearching && "animate-pulse")} />
              Search
              {isSearching && (
                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                  Searching...
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search file name or summary..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#1f3a3410] bg-[#1F3A3405] text-sm font-medium text-[#1F3A34] placeholder:text-[#1F3A3440] focus:outline-none focus:ring-2 focus:ring-[#1F3A34] focus:border-transparent"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1F3A3440] hover:text-[#1F3A34] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatus(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    filters.status?.includes(option.value)
                      ? "bg-[#1F3A34] text-white border-[#1F3A34]"
                      : "bg-[#1F3A3408] text-[#1F3A34] border-[#1f3a3410] hover:bg-[#1F3A3410]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Review Status Filter */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              Review Status
            </label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleReviewStatus(option.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                    filters.review_status?.includes(option.value)
                      ? "bg-[#1F3A34] text-white border-[#1F3A34]"
                      : "bg-[#1F3A3408] text-[#1F3A34] border-[#1f3a3410] hover:bg-[#1F3A3410]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Call Success Toggle */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              Call Outcome
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setCallSuccess(true)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2",
                  filters.call_success === true
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Success
              </button>
              <button
                onClick={() => setCallSuccess(false)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2",
                  filters.call_success === false
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                )}
              >
                <XCircle className="w-4 h-4" />
                Failed
              </button>
              <button
                onClick={() => setCallSuccess(null)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                  filters.call_success === undefined
                    ? "bg-[#1F3A34] text-white border-[#1F3A34]"
                    : "bg-[#1F3A3408] text-[#1F3A34] border-[#1f3a3410] hover:bg-[#1F3A3410]"
                )}
              >
                All
              </button>
            </div>
          </div>

          {/* Sentiment Filter */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              Sentiment
            </label>
            <div className="flex gap-2">
              {SENTIMENT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSentiment(filters.sentiment === option.value ? null : option.value)}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-2",
                      filters.sentiment === option.value
                        ? "bg-[#1F3A34] text-white border-[#1F3A34]"
                        : "bg-[#1F3A3408] text-[#1F3A34] border-[#1f3a3410] hover:bg-[#1F3A3410]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", filters.sentiment !== option.value && option.color)} />
                    <span className="hidden sm:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score Range Slider */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              <BarChart3 className="w-3 h-3 inline mr-1" />
              Score Range: {filters.min_score || 0} - {filters.max_score || 100}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.min_score || 0}
                onChange={(e) => setScoreRange(Number(e.target.value), filters.max_score)}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.max_score || 100}
                onChange={(e) => setScoreRange(filters.min_score, Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
              <Tag className="w-3 h-3 inline mr-1" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 rounded-lg border border-[#1f3a3410] bg-[#1F3A3405] text-sm font-medium text-[#1F3A34] placeholder:text-[#1F3A3440] focus:outline-none focus:ring-2 focus:ring-[#1F3A34]"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 rounded-lg bg-[#1F3A34] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1F3A34]/90 transition-all"
              >
                Add
              </button>
            </div>
            {filters.tag && filters.tag.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.tag.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns */}
          {campaigns.length > 0 && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
                Campaigns
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {campaigns.map((campaign) => (
                  <label key={campaign.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.campaign_id?.includes(campaign.id) || false}
                      onChange={() => toggleCampaign(campaign.id)}
                      className="rounded border-[#1f3a3410]"
                    />
                    <span className="text-sm font-medium text-[#1F3A34]">{campaign.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Questionnaires */}
          {questionnaires.length > 0 && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#1F3A3470] mb-2">
                Questionnaires
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {questionnaires.map((questionnaire) => (
                  <label key={questionnaire.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.questionnaire_id?.includes(questionnaire.id) || false}
                      onChange={() => toggleQuestionnaire(questionnaire.id)}
                      className="rounded border-[#1f3a3410]"
                    />
                    <span className="text-sm font-medium text-[#1F3A34]">{questionnaire.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
