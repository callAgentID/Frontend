/**
 * Currency and number formatting utilities for LLM cost display
 */

/**
 * Format a USD cost with appropriate decimal places for LLM costs
 * Uses more decimals for very small amounts (sub-cent costs)
 */
export function formatLLMCost(usd: number | null | undefined): string {
  if (usd === null || usd === undefined) return "—";

  // Use more decimals for very small amounts
  const decimals = usd < 0.01 ? 6 : usd < 1 ? 4 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(usd);
}

/**
 * Format token counts with comma separators for readability
 */
export function formatTokens(count: number | null | undefined): string {
  if (count === null || count === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(count);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toString();
}

/**
 * Format percentage with 2 decimal places
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(2)}%`;
}
