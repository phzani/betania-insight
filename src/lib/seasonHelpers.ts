/**
 * Season helpers for sports data
 */

export interface SeasonConfig {
  current: number;
  fallback: number;
}

/**
 * Brazilian leagues follow calendar year
 * European leagues typically span across two years but are represented by the starting year
 */
export const LEAGUE_SEASON_CONFIG: Record<number, { type: 'calendar' | 'span'; offset?: number }> = {
  // Brazilian leagues - calendar year
  71: { type: 'calendar' }, // Brasileirão Série A
  72: { type: 'calendar' }, // Brasileirão Série B
  73: { type: 'calendar' }, // Brasileirão Série C
  74: { type: 'calendar' }, // Brasileirão Série D
  75: { type: 'calendar' }, // Copa do Brasil
  
  // European leagues - span across years but represented by starting year
  39: { type: 'span', offset: 0 }, // Premier League
  140: { type: 'span', offset: 0 }, // La Liga
  78: { type: 'span', offset: 0 }, // Bundesliga
  135: { type: 'span', offset: 0 }, // Serie A (Italy)
  61: { type: 'span', offset: 0 }, // Ligue 1
  2: { type: 'span', offset: 0 }, // Champions League
};

/**
 * Determines the correct season for a given league
 */
export function getCurrentSeason(leagueId: number): SeasonConfig {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  const config = LEAGUE_SEASON_CONFIG[leagueId];
  
  if (!config) {
    // Default to calendar year for unknown leagues
    return {
      current: currentYear,
      fallback: currentYear - 1
    };
  }
  
  if (config.type === 'calendar') {
    // Brazilian leagues - using 2024 data as it's more available
    return {
      current: 2024,
      fallback: 2023
    };
  }
  
  // European leagues span across years
  // Season 2025 represents 2025-2026 season
  // Typically starts in August/September
  if (currentMonth >= 8) {
    // After August, use current year as season
    return {
      current: currentYear,
      fallback: currentYear - 1
    };
  } else {
    // Before August, still in previous year's season
    return {
      current: currentYear - 1,
      fallback: currentYear - 2
    };
  }
}

/**
 * Gets season with fallback logic
 */
export function getSeasonWithFallback(leagueId: number): { primary: number; fallback: number } {
  const config = getCurrentSeason(leagueId);
  return {
    primary: config.current,
    fallback: config.fallback
  };
}

/**
 * Checks if we should prioritize current year data
 */
export function shouldUseFallback(leagueId: number): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  
  // For Brazilian leagues, check if it's early in the year
  if (LEAGUE_SEASON_CONFIG[leagueId]?.type === 'calendar') {
    // Between January and March, previous year data might be more relevant
    return currentMonth <= 3;
  }
  
  return false;
}