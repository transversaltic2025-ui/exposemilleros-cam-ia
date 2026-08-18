export interface AIDashboardSummary {
  totalProjects: number; analyzedProjects: number; pendingProjects: number; failedProjects: number; thematicLines: number;
  avgInnovation: number; avgPertinence: number; avgImpact: number; avgViability: number;
  explicitGenderFocus: number; womenInvolved: number; womenInFormulation: number; womenInExecution: number; genderNotReported: number;
  topTrends: string[]; topRisks: string[]; topOpportunities: string[]; genderGaps: string[]; genderActions: string[]; lastBulkAnalysis: string | null;
}
export interface AIDashboardLine {
  linea_tematica: string; totalProjects: number; analyzedProjects: number; avgInnovation: number; avgPertinence: number; avgImpact: number; avgViability: number;
  dominantTrendLevel: string; keywords: string[]; opportunities: string[]; risks: string[]; explicitGenderFocus: number; womenInFormulation: number; womenInExecution: number; genderNotReported: number;
}
export interface AIDashboardProject {
  id: string; linea_tematica: string; semillero: string; estadoAnalisis: string; analyzed: boolean;
  trendLevel: string; innovation: number; pertinence: number; impact: number; viability: number;
  methodologicalClarity: number; trendArticulation: number; explicitGenderFocus: boolean;
  womenInvolved: boolean; womenInFormulation: boolean; womenInExecution: boolean; genderNotReported: boolean;
  keywords: string[]; risks: string[]; opportunities: string[];
}
export interface AIDashboardChartItem { name: string; value: number; [key: string]: string | number; }
export interface AIDashboardCharts {
  projectsByLine: AIDashboardChartItem[]; indicatorsByLine: AIDashboardChartItem[]; trendLevels: AIDashboardChartItem[];
  genderFocus: AIDashboardChartItem[]; womenParticipation: AIDashboardChartItem[]; topKeywords: AIDashboardChartItem[];
  topRisks: AIDashboardChartItem[]; topOpportunities: AIDashboardChartItem[]; heatmapByLine: AIDashboardChartItem[];
}
export interface AIDashboardFilters { lineas: string[]; semilleros: string[]; nivelesTendencia: string[]; estadosAnalisis: string[]; }
export interface AIDashboardData { success: true; summary: AIDashboardSummary; byLine: AIDashboardLine[]; charts: AIDashboardCharts; filters: AIDashboardFilters; projects: AIDashboardProject[]; }
