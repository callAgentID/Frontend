export interface WorkerProfile {
  id: string;
  name: string;
  stt_provider: "gladia";
  stt_model: "v2";
  llm_script_provider: "openrouter";
  llm_script_model: string;
  llm_qa_provider: "openrouter";
  llm_qa_model: string;
  active: boolean;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string | null;
  context_length: number | null;
  max_completion_tokens: number | null;
  prompt_price_per_million_usd: string | null;
  completion_price_per_million_usd: string | null;
  input_modalities: string[];
  output_modalities: string[];
  supported_parameters: string[];
  expiration_date: string | null;
  eligible: boolean;
  ineligibility_reasons: string[];
}

export interface OpenRouterModelPage {
  items: OpenRouterModel[];
  total: number;
  offset: number;
  limit: number;
  fetched_at: string;
  stale: boolean;
}

export interface LlmCostAnalytics {
  aggregate?: {
    total_spent_usd?: number;
    total_tokens_used?: number;
    total_calls_processed?: number;
    llm_requests?: number;
    unpriced_requests?: number;
    cost_data_complete?: boolean;
    average_cost_per_call?: number;
  };
  breakdown_by_model?: Record<string, {
    provider: string;
    model: string;
    calls_count: number;
    requests_count: number;
    tokens: number;
    cost_usd: number;
    cost_data_complete: boolean;
  }>;
  breakdown_by_profile?: Array<{
    processing_profile_id: string | null;
    profile_name: string | null;
    llm_script_model: string | null;
    llm_qa_model: string | null;
    calls_count: number;
    requests_count: number;
    total_tokens: number;
    total_cost_usd: number;
    profile_controlled_cost_usd?: number;
    cost_per_million_tokens_usd?: number | null;
    cost_data_complete: boolean;
  }>;
  breakdown_by_stage?: Record<string, unknown> | Array<unknown>;
  breakdown_by_campaign?: Array<{
    campaign_id: string | null;
    campaign_name: string | null;
    total_cost_usd: number;
    total_tokens: number;
  }>;
}

export function profileId(profile: Pick<WorkerProfile, "id"> & { _id?: string }) {
  return profile.id || profile._id || "";
}

export function formatWorkerProfileModels(profile: Pick<WorkerProfile, "llm_script_model" | "llm_qa_model">) {
  if (profile.llm_script_model === profile.llm_qa_model) return profile.llm_script_model;
  return `Script: ${profile.llm_script_model} · QA: ${profile.llm_qa_model}`;
}
