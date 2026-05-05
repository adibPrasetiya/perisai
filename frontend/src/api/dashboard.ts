import apiClient from './client'
import type { PaginationMeta } from '@/types'

// ─── Filter options ────────────────────────────────────────────────────────────

export interface DashboardFilterProgram {
  id: string
  name: string
  year: number
  status: string
}

export interface DashboardFilterContext {
  id: string
  name: string
  code: string
  contextType: 'ASSET' | 'PROCESS'
}

export interface DashboardFilters {
  programs: DashboardFilterProgram[]
  contexts: DashboardFilterContext[]
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export interface RiskLevelDistItem {
  name: string
  color: string
  order: number
  count: number
}

export interface CategoryDistItem {
  name: string
  color: string
  count: number
}

export interface ImpactAreaDistItem {
  name: string
  avgScore: number
  maxScore: number
  count: number
}

export interface AssetCategoryDistItem {
  name: string
  count: number
}

export interface DashboardOverview {
  summary: {
    totalRisks: number
    inherentAssessedCount: number
    residualAssessedCount: number
    residualAssessedPct: number
    treatmentTotal: number
    treatmentCompleted: number
    treatmentCompletedPct: number
    overdueCount: number
    totalUnitsWithPapers: number
    approvedPapersCount: number
  }
  inherentLevelDist: RiskLevelDistItem[]
  residualLevelDist: RiskLevelDistItem[]
  categoryDist: CategoryDistItem[]
  impactAreaDist: ImpactAreaDistItem[]
  assetCategoryDist: AssetCategoryDistItem[]
  wpStatusCounts: Record<string, number>
  treatmentStatusCounts: Record<string, number>
}

// ─── Top Risks ────────────────────────────────────────────────────────────────

export interface TopRiskLevel {
  name: string
  color: string
  score: number
}

export interface TopRiskEntry {
  rank: number
  id: string
  code: string
  name: string
  unitKerja: { id: string; name: string; code: string }
  workingPaperId: string
  riskCategory: { name: string; color: string } | null
  contextName: string | null
  inherentLevel: TopRiskLevel | null
  residualLevel: TopRiskLevel | null
  effectiveLevel: TopRiskLevel | null
  assessmentType: 'RESIDUAL' | 'INHERENT'
  treatmentSummary: { total: number; completed: number; overdue: number }
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export type ActivityType =
  | 'RISK_IDENTIFIED'
  | 'WP_SUBMITTED'
  | 'WP_APPROVED'
  | 'TREATMENT_COMPLETED'
  | 'TREATMENT_VERIFIED'

export interface ActivityEvent {
  type: ActivityType
  timestamp: string
  title: string
  detail: string
  unitKerja: { name: string; code: string }
  workingPaperId: string
  actor: string | null
  meta: Record<string, string | null>
}

// ─── Units / Risks (drilldown) ────────────────────────────────────────────────

export interface UnitKerjaSummary {
  unitKerja: { id: string; name: string; code: string }
  workingPaperId: string
  workingPaperStatus: string
  riskCount: number
  riskLevelBreakdown: { name: string; color: string; count: number }[]
  treatmentCompletionPct: number | null
}

export interface DashboardRiskEntry {
  id: string
  code: string
  name: string
  unitKerja: { id: string; name: string; code: string }
  workingPaperId: string
  workingPaperStatus: string
  contextName: string | null
  contextType: 'ASSET' | 'PROCESS' | null
  effectiveRiskLevelName: string | null
  effectiveRiskLevelColor: string | null
  effectiveFinalScore: number | null
  assessmentType: 'RESIDUAL' | 'INHERENT' | null
  treatmentSummary: { total: number; completed: number }
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface DashboardFilterParams {
  programId?: string
  riskContextId?: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getFilters() {
    return apiClient.get<{ message: string; data: DashboardFilters }>('/dashboard/filters')
  },

  getOverview(params?: DashboardFilterParams) {
    return apiClient.get<{ message: string; data: DashboardOverview }>(
      '/dashboard/overview',
      { params },
    )
  },

  getTopRisks(params?: DashboardFilterParams & { limit?: number }) {
    return apiClient.get<{ message: string; data: TopRiskEntry[] }>(
      '/dashboard/top-risks',
      { params },
    )
  },

  getRecentActivity(params?: DashboardFilterParams) {
    return apiClient.get<{ message: string; data: ActivityEvent[] }>(
      '/dashboard/activity',
      { params },
    )
  },

  getUnits(params?: DashboardFilterParams & { page?: number; limit?: number }) {
    return apiClient.get<{ message: string; data: UnitKerjaSummary[]; pagination: PaginationMeta }>(
      '/dashboard/units',
      { params },
    )
  },

  getRisks(
    params?: DashboardFilterParams & {
      unitKerjaId?: string
      riskLevelName?: string
      page?: number
      limit?: number
    },
  ) {
    return apiClient.get<{ message: string; data: DashboardRiskEntry[]; pagination: PaginationMeta }>(
      '/dashboard/risks',
      { params },
    )
  },
}
