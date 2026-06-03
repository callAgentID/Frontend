"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import {
  DollarSign,
  Zap,
  TrendingUp,
  Database,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  BarChart3,
  Loader2,
  ChevronDown,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLLMCost, formatTokens, formatCompactNumber } from "@/lib/formatters";

interface LLMAnalytics {
  time_frame: {
    start: string | null;
    end: string | null;
  };
  aggregate: {
    total_spent_usd: number;
    total_tokens_used: number;
    total_calls_processed: number;
    average_cost_per_call: number;
  };
  breakdown_by_model: {
    [key: string]: {
      calls_count: number;
      tokens: number;
      cost_usd: number;
    };
  };
  breakdown_by_campaign: Array<{
    campaign_id: string;
    campaign_name: string;
    total_cost_usd: number;
    total_tokens: number;
  }>;
}

export default function AdminPage() {
  const t = useTranslations('admin');

  const [analytics, setAnalytics] = useState<LLMAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  // Campaigns list
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchAnalytics();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const res = await fetch(`${baseUrl}/api/v1/campaigns/`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zk1354qz0k.execute-api.eu-central-1.amazonaws.com";
      const params = new URLSearchParams();

      if (startDate) params.append('created_after', new Date(startDate).toISOString());
      if (endDate) params.append('created_before', new Date(endDate).toISOString());
      selectedCampaigns.forEach(cid => params.append('campaign_id', cid));

      const queryString = params.toString();
      const url = `${baseUrl}/api/v1/analytics/llm-costs${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      if (!res.ok) throw new Error("Failed to fetch LLM analytics");

      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to fetch LLM analytics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedCampaigns([]);
    // Re-fetch after reset
    setTimeout(fetchAnalytics, 100);
  };

  // Calculate model colors for chart
  const getModelColor = (index: number): string => {
    const colors = [
      'from-[#4A7FA7] to-[#1A3D63]',
      'from-[#B3CFE5] to-[#4A7FA7]',
      'from-[#1A3D63] to-[#0A1931]',
      'from-[#4A7FA7] to-[#B3CFE5]',
    ];
    return colors[index % colors.length];
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] flex items-center justify-center text-white glow">
              <DollarSign className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-[900] text-[#F6FAFD] tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-[#B3CFE5] text-sm font-medium">LLM cost analytics and platform metrics</p>
        </div>

        <button
          onClick={handleApplyFilters}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] glow text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Refresh Data
        </button>
      </div>

      {/* Filters */}
      <div className="p-6 bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-[#4A7FA7]" />
          <h3 className="text-lg font-[850] text-[#F6FAFD]">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-12 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-xl px-4 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-12 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-xl px-4 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#B3CFE5]">Campaigns</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                className="w-full h-12 bg-[#0A1931]/60 border border-[#4A7FA7]/30 rounded-xl px-4 text-sm font-semibold text-[#F6FAFD] outline-none focus:border-[#4A7FA7] transition-all flex items-center justify-between"
              >
                <span className={cn(selectedCampaigns.length === 0 ? "text-[#B3CFE5]/50" : "")}>
                  {selectedCampaigns.length === 0
                    ? "Select campaigns..."
                    : `${selectedCampaigns.length} campaign${selectedCampaigns.length !== 1 ? 's' : ''} selected`
                  }
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isCampaignDropdownOpen && "rotate-180")} />
              </button>

              {isCampaignDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsCampaignDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A3D63]/95 backdrop-blur-md border border-[#4A7FA7]/30 rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto">
                    {campaigns.length === 0 ? (
                      <div className="p-4 text-center text-[#B3CFE5] text-sm">No campaigns available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {campaigns.map(c => {
                          const campaignId = c.id || c._id;
                          const isSelected = selectedCampaigns.includes(campaignId);
                          return (
                            <label
                              key={campaignId}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#4A7FA7]/20 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCampaigns([...selectedCampaigns, campaignId]);
                                  } else {
                                    setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId));
                                  }
                                }}
                                className="w-4 h-4 rounded border-[#4A7FA7]/30 text-[#4A7FA7]"
                              />
                              <span className="text-sm font-semibold text-[#F6FAFD] flex-1">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Selected Campaigns Pills */}
            {selectedCampaigns.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCampaigns.map(campaignId => {
                  const campaign = campaigns.find(c => (c.id || c._id) === campaignId);
                  if (!campaign) return null;
                  return (
                    <span
                      key={campaignId}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-[#4A7FA7]/20 text-[#B3CFE5] border border-[#4A7FA7]/30 rounded-lg text-xs font-semibold"
                    >
                      {campaign.name}
                      <button
                        onClick={() => setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaignId))}
                        className="hover:text-[#F6FAFD] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyFilters}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-[#4A7FA7] to-[#1A3D63] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            disabled={isLoading}
            className="px-6 py-2 bg-[#1A3D63]/60 text-[#B3CFE5] hover:text-[#F6FAFD] rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-[#4A7FA7] animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-10 bg-red-500/20 border border-red-500/30 rounded-3xl text-center space-y-4">
          <p className="text-red-400 font-bold">{error}</p>
          <button onClick={fetchAnalytics} className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest">
            Retry
          </button>
        </div>
      )}

      {/* Analytics Content */}
      {!isLoading && !error && analytics && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              icon={DollarSign}
              label="Total Spent"
              value={formatLLMCost(analytics.aggregate.total_spent_usd)}
              subtext={`${analytics.aggregate.total_calls_processed} calls processed`}
              color="from-[#4A7FA7] to-[#1A3D63]"
            />
            <KPICard
              icon={Zap}
              label="Total Tokens"
              value={formatCompactNumber(analytics.aggregate.total_tokens_used)}
              subtext={formatTokens(analytics.aggregate.total_tokens_used)}
              color="from-[#B3CFE5] to-[#4A7FA7]"
            />
            <KPICard
              icon={BarChart3}
              label="Avg Cost/Call"
              value={formatLLMCost(analytics.aggregate.average_cost_per_call)}
              subtext="Per call average"
              color="from-[#1A3D63] to-[#4A7FA7]"
            />
            <KPICard
              icon={Database}
              label="Calls Processed"
              value={analytics.aggregate.total_calls_processed.toLocaleString()}
              subtext="In selected period"
              color="from-[#4A7FA7] to-[#B3CFE5]"
            />
          </div>

          {/* Model Breakdown */}
          <div className="p-10 bg-[#1A3D63]/60 glow rounded-3xl border border-[#4A7FA7]/30 space-y-8">
            <div className="flex items-center gap-3">
              <PieChart className="w-6 h-6 text-[#4A7FA7]" />
              <h3 className="text-xl font-[850] text-[#F6FAFD]">Cost by Model</h3>
            </div>

            <div className="space-y-4">
              {Object.entries(analytics.breakdown_by_model).map(([modelKey, data], index) => {
                const percentage = (data.cost_usd / analytics.aggregate.total_spent_usd) * 100;
                return (
                  <div key={modelKey} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#F6FAFD]">{modelKey}</p>
                        <p className="text-xs font-semibold text-[#B3CFE5]">
                          {data.calls_count.toLocaleString()} calls • {formatTokens(data.tokens)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-[900] text-[#F6FAFD]">{formatLLMCost(data.cost_usd)}</p>
                        <p className="text-xs font-bold text-[#B3CFE5]">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="relative h-3 bg-[#0A1931]/60 rounded-full overflow-hidden">
                      <div
                        className={cn("absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all", getModelColor(index))}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Breakdown */}
          <div className="p-10 bg-[#1A3D63]/60 glow rounded-3xl border border-[#4A7FA7]/30 space-y-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-[#4A7FA7]" />
              <h3 className="text-xl font-[850] text-[#F6FAFD]">Cost by Campaign</h3>
            </div>

            {analytics.breakdown_by_campaign.length === 0 ? (
              <p className="text-center py-8 text-[#B3CFE5] font-semibold">No campaign data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#4A7FA7]/30">
                      <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Campaign</th>
                      <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Total Cost</th>
                      <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">Total Tokens</th>
                      <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-wider text-[#B3CFE5]">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4A7FA7]/20">
                    {analytics.breakdown_by_campaign
                      .sort((a, b) => b.total_cost_usd - a.total_cost_usd)
                      .map((campaign) => {
                        const percentage = (campaign.total_cost_usd / analytics.aggregate.total_spent_usd) * 100;
                        return (
                          <tr key={campaign.campaign_id} className="hover:bg-[#1A3D63]/40 transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-[#F6FAFD]">{campaign.campaign_name}</td>
                            <td className="py-4 px-4 text-right text-sm font-[900] text-[#F6FAFD]">{formatLLMCost(campaign.total_cost_usd)}</td>
                            <td className="py-4 px-4 text-right text-sm font-semibold text-[#B3CFE5]">{formatTokens(campaign.total_tokens)}</td>
                            <td className="py-4 px-4 text-right text-sm font-bold text-[#4A7FA7]">{percentage.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Time Frame Info */}
          {(analytics.time_frame.start || analytics.time_frame.end) && (
            <div className="p-6 bg-[#0A1931]/60 rounded-2xl border border-[#4A7FA7]/20 flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#4A7FA7]" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#B3CFE5] mb-1">Time Period</p>
                <p className="text-sm font-bold text-[#F6FAFD]">
                  {analytics.time_frame.start ? new Date(analytics.time_frame.start).toLocaleDateString() : 'All time'}
                  {' '} - {' '}
                  {analytics.time_frame.end ? new Date(analytics.time_frame.end).toLocaleDateString() : 'Present'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

interface KPICardProps {
  icon: any;
  label: string;
  value: string;
  subtext: string;
  color: string;
}

function KPICard({ icon: Icon, label, value, subtext, color }: KPICardProps) {
  return (
    <div className="p-6 bg-[#1A3D63]/60 glow rounded-2xl border border-[#4A7FA7]/30 space-y-4 group hover:scale-105 [transition:transform_150ms_ease] [will-change:transform]">
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-[#B3CFE5] mb-2">{label}</p>
        <p className="text-3xl font-[900] text-[#F6FAFD] mb-1">{value}</p>
        <p className="text-xs font-semibold text-[#B3CFE5]">{subtext}</p>
      </div>
    </div>
  );
}
