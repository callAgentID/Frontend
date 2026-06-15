"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { useApi } from "@/lib/useApi";
import {
  DollarSign,
  Zap,
  Database,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  BarChart3,
  Loader2,
  ChevronDown,
  X,
  TrendingUp,
  Users,
  ShieldAlert,
  Activity,
  Tag,
  Target,
  Clock,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLLMCost, formatTokens, formatCompactNumber } from "@/lib/formatters";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title
} from "chart.js";
import { Doughnut, Bar, Line, Radar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title
);

// ─── Types ────────────────────────────────────────────────

interface LLMAnalytics {
  time_frame: { start: string | null; end: string | null };
  aggregate: {
    total_spent_usd: number;
    total_tokens_used: number;
    total_calls_processed: number;
    average_cost_per_call: number;
  };
  breakdown_by_model: Record<string, { calls_count: number; tokens: number; cost_usd: number }>;
  breakdown_by_campaign: Array<{ campaign_id: string; campaign_name: string; total_cost_usd: number; total_tokens: number }>;
}

interface VolumeAnalytics {
  total_calls: number;
  status_distribution: Record<string, number>;
  volume_over_time: Array<{ date: string; count: number }>;
  avg_processing_time_seconds: number;
  human_review_backlog: number;
}

interface QualityAnalytics {
  avg_overall_score: number;
  call_success_rate: number;
  success_reasons_breakdown: Record<string, number>;
  agent_performance_score: Record<string, number>;
  campaign_quality_score: Record<string, number>;
}

interface InteractionAnalytics {
  intent_distribution: Record<string, number>;
  top_ai_tags: Record<string, number>;
  top_user_tags: Record<string, number>;
  average_caller_sentiment: number | null;
  coaching_topic_frequency: Record<string, number>;
}

interface ComplianceAnalytics {
  red_flag_occurrence_rate: number;
  common_violations: Record<string, number>;
  red_flag_score_distribution: Record<string, number>;
}

interface QAAnalytics {
  human_intervention_rate: number;
  avg_qa_review_time_seconds: number;
  ai_override_rate: number;
  escalation_rate: number;
}

// ─── Chart theme ──────────────────────────────────────────

// Silver shades — graduated from bright silver to deep blue-silver
const CHART_COLORS = [
  "rgba(220, 230, 245, 0.90)",  // bright silver
  "rgba(190, 205, 228, 0.88)",  // silver-blue 1
  "rgba(160, 180, 215, 0.88)",  // silver-blue 2
  "rgba(135, 158, 200, 0.86)",  // medium silver-blue
  "rgba(110, 138, 188, 0.86)",  // deeper silver-blue
  "rgba(88,  118, 175, 0.85)",  // blue-silver
  "rgba(68,   98, 160, 0.85)",  // dark silver-blue
  "rgba(50,   80, 148, 0.84)",  // deep blue-silver
  "rgba(205, 218, 238, 0.88)",  // pale silver
  "rgba(175, 193, 222, 0.86)",  // mid-pale silver
];

const CHART_BORDERS = CHART_COLORS.map(c => c.replace(/0\.\d+\)$/, "1)"));

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "#B3CFE5", font: { size: 11, weight: "bold" as const } }
    },
    tooltip: {
      backgroundColor: "rgba(10,25,49,0.95)",
      titleColor: "#F6FAFD",
      bodyColor: "#B3CFE5",
      borderColor: "rgba(74,127,167,0.4)",
      borderWidth: 1,
    }
  },
  scales: {
    x: {
      ticks: { color: "#B3CFE5", font: { size: 10 } },
      grid: { color: "rgba(74,127,167,0.1)" }
    },
    y: {
      ticks: { color: "#B3CFE5", font: { size: 10 } },
      grid: { color: "rgba(74,127,167,0.1)" }
    }
  }
};

// ─── Main Component ───────────────────────────────────────

export default function AdminPage() {
  const t = useTranslations('admin');
  const [llmData, setLlmData] = useState<LLMAnalytics | null>(null);
  const [volumeData, setVolumeData] = useState<VolumeAnalytics | null>(null);
  const [qualityData, setQualityData] = useState<QualityAnalytics | null>(null);
  const [interactionData, setInteractionData] = useState<InteractionAnalytics | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceAnalytics | null>(null);
  const [qaData, setQaData] = useState<QAAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  const { apiFetch } = useApi();

  const buildParams = () => {
    const params = new URLSearchParams();
    if (startDate) params.append("created_after", new Date(startDate).toISOString());
    if (endDate) params.append("created_before", new Date(endDate).toISOString());
    selectedCampaigns.forEach(id => params.append("campaign_id", id));
    return params.toString();
  };

  const fetchAll = async () => {
    setIsLoading(true);
    const qs = buildParams();
    const q = qs ? `?${qs}` : "";
    // For campaign-specific endpoints use first selected or nothing
    const campaignQs = selectedCampaigns.length > 0
      ? `?campaign_id=${selectedCampaigns[0]}${startDate ? `&created_after=${new Date(startDate).toISOString()}` : ""}${endDate ? `&created_before=${new Date(endDate).toISOString()}` : ""}`
      : (startDate || endDate)
        ? `?${qs}`
        : "";

    try {
      const [llm, volume, quality, interaction, compliance, qa, camps] = await Promise.allSettled([
        apiFetch(`/api/v1/analytics/llm-costs${q}`).then(r => r.json()),
        apiFetch(`/api/v1/analytics/volume${campaignQs}`).then(r => r.json()),
        apiFetch(`/api/v1/analytics/quality${campaignQs}`).then(r => r.json()),
        apiFetch(`/api/v1/analytics/interaction${campaignQs}`).then(r => r.json()),
        apiFetch(`/api/v1/analytics/compliance${campaignQs}`).then(r => r.json()),
        apiFetch(`/api/v1/analytics/qa${campaignQs}`).then(r => r.json()),
        apiFetch(`/api/v1/campaigns/`).then(r => r.json()),
      ]);

      if (llm.status === "fulfilled") setLlmData(llm.value);
      if (volume.status === "fulfilled") setVolumeData(volume.value);
      if (quality.status === "fulfilled") setQualityData(quality.value);
      if (interaction.status === "fulfilled") setInteractionData(interaction.value);
      if (compliance.status === "fulfilled") setComplianceData(compliance.value);
      if (qa.status === "fulfilled") setQaData(qa.value);
      if (camps.status === "fulfilled" && Array.isArray(camps.value)) setCampaigns(camps.value);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Chart Datasets ───────────────────────────────────

  // Volume over time — Line chart
  const volumeLineData = volumeData ? {
    labels: volumeData.volume_over_time.map(v => v.date),
    datasets: [{
      label: "Calls",
      data: volumeData.volume_over_time.map(v => v.count),
      borderColor: "rgba(190,205,228,1)",
      backgroundColor: "rgba(190,205,228,0.12)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "rgba(220,230,245,1)",
      pointBorderColor: "#fff",
      pointRadius: 5,
      pointHoverRadius: 8,
    }]
  } : null;

  // Status distribution — Doughnut
  const statusDoughnutData = volumeData ? {
    labels: Object.keys(volumeData.status_distribution),
    datasets: [{
      data: Object.values(volumeData.status_distribution),
      backgroundColor: CHART_COLORS,
      borderColor: CHART_BORDERS,
      borderWidth: 2,
    }]
  } : null;

  // Agent performance — Horizontal bar (each agent different color)
  const agentBarData = qualityData && Object.keys(qualityData.agent_performance_score).length > 0 ? {
    labels: Object.keys(qualityData.agent_performance_score),
    datasets: [{
      label: "Avg Score",
      data: Object.values(qualityData.agent_performance_score),
      backgroundColor: Object.keys(qualityData.agent_performance_score).map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderColor: Object.keys(qualityData.agent_performance_score).map((_, i) => CHART_BORDERS[i % CHART_BORDERS.length]),
      borderWidth: 2,
      borderRadius: 8,
    }]
  } : null;

  // Top AI Tags — Bar chart (each bar a different color)
  const tagsBarData = interactionData ? {
    labels: Object.keys(interactionData.top_ai_tags).slice(0, 10),
    datasets: [{
      label: "Frequency",
      data: Object.values(interactionData.top_ai_tags).slice(0, 10),
      backgroundColor: CHART_COLORS.slice(0, 10),
      borderColor: CHART_BORDERS.slice(0, 10),
      borderWidth: 2,
      borderRadius: 6,
    }]
  } : null;

  // Red flag score distribution — Doughnut (blue shades)
  const redFlagDoughnutData = complianceData ? {
    labels: Object.keys(complianceData.red_flag_score_distribution),
    datasets: [{
      data: Object.values(complianceData.red_flag_score_distribution),
      backgroundColor: [
        "rgba(220, 230, 245, 0.90)",  // bright silver
        "rgba(160, 180, 215, 0.88)",  // mid silver
        "rgba(88,  118, 175, 0.85)",  // dark silver-blue
      ],
      borderColor: ["rgba(220,230,245,1)", "rgba(160,180,215,1)", "rgba(88,118,175,1)"],
      borderWidth: 2,
    }]
  } : null;

  // Common violations — Bar chart (blue shades)
  const violationsBarData = complianceData ? {
    labels: Object.keys(complianceData.common_violations),
    datasets: [{
      label: "Violations",
      data: Object.values(complianceData.common_violations),
      backgroundColor: CHART_COLORS,
      borderColor: CHART_BORDERS,
      borderWidth: 2,
      borderRadius: 6,
    }]
  } : null;

  // LLM model cost — Doughnut
  const llmModelDoughnutData = llmData ? {
    labels: Object.keys(llmData.breakdown_by_model),
    datasets: [{
      data: Object.values(llmData.breakdown_by_model).map(m => m.cost_usd),
      backgroundColor: CHART_COLORS,
      borderColor: CHART_BORDERS,
      borderWidth: 2,
    }]
  } : null;

  // QA + quality radar
  const radarData = (qualityData && qaData) ? {
    labels: ["Avg Score", "Success Rate", "Intervention Rate", "Override Rate", "Escalation Rate", "Compliance"],
    datasets: [{
      label: "Platform Health",
      data: [
        qualityData.avg_overall_score,
        qualityData.call_success_rate * 100,
        qaData.human_intervention_rate * 100,
        qaData.ai_override_rate * 100,
        qaData.escalation_rate * 100,
        complianceData ? (1 - complianceData.red_flag_occurrence_rate) * 100 : 0,
      ],
      backgroundColor: "rgba(190,205,228,0.10)",
      borderColor: "rgba(190,205,228,0.90)",
      pointBackgroundColor: [
        "rgba(220, 230, 245, 1)",
        "rgba(190, 205, 228, 1)",
        "rgba(160, 180, 215, 1)",
        "rgba(135, 158, 200, 1)",
        "rgba(110, 138, 188, 1)",
        "rgba(88,  118, 175, 1)",
      ],
      pointBorderColor: "rgba(4,12,30,0.9)",
      pointRadius: 5,
      borderWidth: 2,
    }]
  } : null;

  return (
    <main className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-[900] text-[#F6FAFD] tracking-tight">{t('title')}</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium pl-1">{t('subtitle')}</p>
        </div>
        <button onClick={fetchAll} disabled={isLoading} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-colors shrink-0">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('refresh')}
        </button>
      </div>

      {/* Filters */}
      <div className="p-5 bg-blue-950/30 rounded-2xl border border-blue-400/18 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-[#4A7FA7]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-[#F6FAFD]">{t('filters')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{t('startDate')}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full h-10 bg-black/25 border border-blue-400/18 rounded-xl px-3 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{t('endDate')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full h-10 bg-black/25 border border-blue-400/18 rounded-xl px-3 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors" />
          </div>
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">{t('campaign')}</label>
            <button type="button" onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
              className="w-full h-10 bg-black/25 border border-blue-400/18 rounded-xl px-3 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-colors flex items-center justify-between">
              <span className={selectedCampaigns.length === 0 ? "text-[#B3CFE5]/50 text-sm" : "text-sm"}>
                {selectedCampaigns.length === 0 ? t('allCampaigns') : `${selectedCampaigns.length} ${t('selectedCount').replace('{count}', '')}`}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform shrink-0", isCampaignDropdownOpen && "rotate-180")} />
            </button>
            {isCampaignDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCampaignDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A3D63]/98 border border-blue-400/18 rounded-xl shadow-2xl z-20 max-h-52 overflow-y-auto">
                  {campaigns.map(c => {
                    const id = c.id || c._id;
                    const checked = selectedCampaigns.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#4A7FA7]/20 cursor-pointer transition-colors">
                        <input type="checkbox" checked={checked} onChange={e => setSelectedCampaigns(e.target.checked ? [...selectedCampaigns, id] : selectedCampaigns.filter(x => x !== id))}
                          className="w-4 h-4 rounded" />
                        <span className="text-sm font-semibold text-[#F6FAFD]">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
            {selectedCampaigns.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedCampaigns.map(id => {
                  const c = campaigns.find(c => (c.id || c._id) === id);
                  return c ? (
                    <span key={id} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#4A7FA7]/20 text-[#B3CFE5] border border-blue-400/18 rounded-lg text-xs font-semibold">
                      {c.name}
                      <button onClick={() => setSelectedCampaigns(selectedCampaigns.filter(x => x !== id))}><X className="w-3 h-3" /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={fetchAll} disabled={isLoading} className="px-5 py-2 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-colors">{t('apply')}</button>
          <button onClick={() => { setStartDate(""); setEndDate(""); setSelectedCampaigns([]); setTimeout(fetchAll, 50); }}
            className="px-5 py-2 bg-blue-950/30 text-[#B3CFE5] hover:text-[#F6FAFD] rounded-xl font-bold text-xs uppercase tracking-wider transition-colors">{t('reset')}</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="space-y-4 text-center">
            <Loader2 className="w-12 h-12 text-[#4A7FA7] animate-spin mx-auto" />
            <p className="text-[#B3CFE5] font-bold text-sm uppercase tracking-widest">{t('loadingAnalytics')}</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Row 1: KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={Database} label={t('totalCalls')} value={volumeData?.total_calls?.toLocaleString() ?? "—"} sub={t('backlog').replace('{count}', String(volumeData?.human_review_backlog ?? 0))} color="from-[#4A7FA7] to-[#1A3D63]" />
            <KPICard icon={Target} label={t('avgScore')} value={qualityData ? `${qualityData.avg_overall_score.toFixed(1)}` : "—"} sub={t('outOf100')} color="from-[#1A3D63] to-[#4A7FA7]" />
            <KPICard icon={CheckCircle2} label={t('successRate')} value={qualityData ? `${(qualityData.call_success_rate * 100).toFixed(1)}%` : "—"} sub={t('callSuccess')} color="from-[#4A7FA7] to-[#B3CFE5]" />
            <KPICard icon={DollarSign} label={t('llmSpend')} value={formatLLMCost(llmData?.aggregate?.total_spent_usd ?? 0)} sub={`${formatCompactNumber(llmData?.aggregate?.total_tokens_used ?? 0)} ${t('tokens_col')}`} color="from-[#B3CFE5] to-[#4A7FA7]" />
            <KPICard icon={Clock} label={t('avgProcessing')} value={volumeData ? `${Math.round(volumeData.avg_processing_time_seconds)}s` : "—"} sub={t('perCall')} color="from-[#1A3D63] to-[#0A1931]" />
            <KPICard icon={ShieldAlert} label={t('redFlagRate')} value={complianceData ? `${(complianceData.red_flag_occurrence_rate * 100).toFixed(1)}%` : "—"} sub={t('occurrenceRate')} color="from-red-900/80 to-red-700/60" />
            <KPICard icon={Users} label={t('agents')} value={qualityData ? Object.keys(qualityData.agent_performance_score).length.toString() : "—"} sub={t('activeAgents')} color="from-[#4A7FA7] to-[#1A3D63]" />
            <KPICard icon={Activity} label={t('qaReviewTime')} value={qaData ? `${Math.round(qaData.avg_qa_review_time_seconds)}s` : "—"} sub={t('avgReviewTime')} color="from-[#1A3D63] to-[#4A7FA7]" />
          </div>

          {/* ── Row 2: Volume over Time + Status Doughnut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title={t('callVolumeOverTime')} icon={TrendingUp}>
                {volumeLineData ? (
                  <div className="h-64">
                    <Line data={volumeLineData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
                  </div>
                ) : <EmptyChart label={t('noData')} />}
              </ChartCard>
            </div>
            <ChartCard title={t('callStatusDistribution')} icon={PieChart}>
              {statusDoughnutData ? (
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={statusDoughnutData} options={{ ...baseChartOptions, scales: undefined, plugins: { ...baseChartOptions.plugins, legend: { position: "bottom", labels: { color: "#B3CFE5", font: { size: 9 }, boxWidth: 10, padding: 8 } } } }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
          </div>

          {/* ── Row 3: Radar + Agent Performance ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('platformHealthRadar')} icon={Activity}>
              {radarData ? (
                <div className="h-72 flex items-center justify-center">
                  <Radar data={radarData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: baseChartOptions.plugins.tooltip },
                    scales: {
                      r: {
                        ticks: { color: "#B3CFE5", font: { size: 9 }, backdropColor: "transparent" },
                        grid: { color: "rgba(44,143,255,0.15)" },
                        angleLines: { color: "rgba(44,143,255,0.25)" },
                        pointLabels: { color: "#F6FAFD", font: { size: 10, weight: "bold" as const } },
                        min: 0, max: 100,
                      }
                    }
                  }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
            <ChartCard title={t('agentPerformanceScore')} icon={Users}>
              {agentBarData ? (
                <div className="h-72">
                  <Bar data={agentBarData} options={{
                    ...baseChartOptions,
                    indexAxis: "y" as const,
                    plugins: { ...baseChartOptions.plugins, legend: { display: false } },
                    scales: { ...baseChartOptions.scales, x: { ...baseChartOptions.scales.x, min: 0, max: 100 } }
                  }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
          </div>

          {/* ── Row 4: Top AI Tags + Red Flag Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartCard title={t('topAiTags')} icon={Tag}>
                {tagsBarData ? (
                  <div className="h-64">
                    <Bar data={tagsBarData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
                  </div>
                ) : <EmptyChart label={t('noData')} />}
              </ChartCard>
            </div>
            <ChartCard title={t('redFlagDistribution')} icon={ShieldAlert}>
              {redFlagDoughnutData ? (
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={redFlagDoughnutData} options={{ ...baseChartOptions, scales: undefined, plugins: { ...baseChartOptions.plugins, legend: { position: "bottom", labels: { color: "#B3CFE5", font: { size: 10 }, boxWidth: 10, padding: 8 } } } }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
          </div>

          {/* ── Row 5: Compliance Violations + LLM Model Cost ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title={t('complianceViolations')} icon={ShieldAlert}>
              {violationsBarData ? (
                <div className="h-64">
                  <Bar data={violationsBarData} options={{ ...baseChartOptions, plugins: { ...baseChartOptions.plugins, legend: { display: false } } }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
            <ChartCard title={t('llmSpendByModel')} icon={DollarSign}>
              {llmModelDoughnutData ? (
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={llmModelDoughnutData} options={{ ...baseChartOptions, scales: undefined, plugins: { ...baseChartOptions.plugins, legend: { position: "right", labels: { color: "#B3CFE5", font: { size: 9 }, boxWidth: 10, padding: 6 } } } }} />
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
          </div>

          {/* ── Row 6: Intent Distribution + LLM Campaign Table ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intent Distribution */}
            <ChartCard title={t('intentDistribution')} icon={Target}>
              {interactionData && Object.keys(interactionData.intent_distribution).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(interactionData.intent_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([intent, count], i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/25 border border-blue-400/12">
                        <span className="text-xs font-black text-[#4A7FA7] shrink-0 w-5 text-right">{count}</span>
                        <p className="text-xs font-medium text-[#B3CFE5] leading-relaxed line-clamp-2">{intent}</p>
                      </div>
                    ))}
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>

            {/* LLM Campaign Cost Table */}
            <ChartCard title={t('llmSpendByCampaign')} icon={DollarSign}>
              {llmData && llmData.breakdown_by_campaign.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-blue-400/18">
                        <th className="text-left py-2 px-2 font-black uppercase tracking-wider text-[#B3CFE5]">{t('campaign_col')}</th>
                        <th className="text-right py-2 px-2 font-black uppercase tracking-wider text-[#B3CFE5]">{t('cost_col')}</th>
                        <th className="text-right py-2 px-2 font-black uppercase tracking-wider text-[#B3CFE5]">{t('tokens_col')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#4A7FA7]/10">
                      {llmData.breakdown_by_campaign.sort((a, b) => b.total_cost_usd - a.total_cost_usd).map(c => (
                        <tr key={c.campaign_id} className="hover:bg-blue-950/20 transition-colors">
                          <td className="py-2.5 px-2 font-semibold text-[#F6FAFD] truncate max-w-[150px]">{c.campaign_name}</td>
                          <td className="py-2.5 px-2 text-right font-black text-[#F6FAFD]">{formatLLMCost(c.total_cost_usd)}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-[#B3CFE5]">{formatTokens(c.total_tokens)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyChart label={t('noData')} />}
            </ChartCard>
          </div>

          {/* ── Row 7: QA Stats ── */}
          {qaData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={t('humanInterventionRate')} value={`${(qaData.human_intervention_rate * 100).toFixed(1)}%`} />
              <StatCard label={t('aiOverrideRate')} value={`${(qaData.ai_override_rate * 100).toFixed(1)}%`} />
              <StatCard label={t('escalationRate')} value={`${(qaData.escalation_rate * 100).toFixed(1)}%`} />
              <StatCard label={t('avgReviewTime')} value={`${Math.round(qaData.avg_qa_review_time_seconds)}s`} />
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────

function KPICard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-5 glass-card rounded-2xl border border-blue-400/18 space-y-3 hover:scale-[1.02] transition-transform">
      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-1">{label}</p>
        <p className="text-2xl font-[900] text-[#F6FAFD] leading-none">{value}</p>
        <p className="text-[10px] font-semibold text-[#B3CFE5] mt-1">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="p-6 glass-card rounded-2xl border border-blue-400/18 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#4A7FA7] shrink-0" />
        <h3 className="text-sm font-black uppercase tracking-wider text-[#F6FAFD]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-blue-950/30 rounded-2xl border border-blue-400/18 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#B3CFE5] mb-2">{label}</p>
      <p className="text-xl font-[900] text-[#F6FAFD]">{value}</p>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-[#B3CFE5]/50 text-xs font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}
