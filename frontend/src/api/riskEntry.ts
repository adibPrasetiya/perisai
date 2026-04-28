import apiClient from './client'
import type { RiskCategory, RiskLevel } from './riskContext'

export type { RiskCategory, RiskLevel }

export type ControlEffectiveness = 'ADEQUATE' | 'PARTIAL' | 'INADEQUATE'
export type TreatmentStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUBMITTED_FOR_REVIEW' | 'VERIFIED'

export const CONTROL_EFFECTIVENESS_LABELS: Record<ControlEffectiveness, string> = {
  ADEQUATE: 'Memadai',
  PARTIAL: 'Sebagian',
  INADEQUATE: 'Tidak Memadai',
}

export const TREATMENT_STATUS_LABELS: Record<TreatmentStatus, string> = {
  PLANNED: 'Direncanakan',
  IN_PROGRESS: 'Sedang Berjalan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  SUBMITTED_FOR_REVIEW: 'Diajukan ke Komite',
  VERIFIED: 'Terverifikasi',
}

export interface RiskEntryContext {
  id: string
  riskContext: { id: string; name: string; code: string; contextType: 'ASSET' | 'PROCESS' }
  programFramework: {
    framework: { id: string; name: string; code: string }
  }
}

export interface RiskControl {
  id: string
  name: string
  description: string | null
  effectiveness: ControlEffectiveness
  order: number
}

export interface AreaScore {
  id: string
  impactAreaId: string
  impactArea: { id: string; name: string }
  likelihoodLevel: number
  impactLevel: number
  score: number
  matrixCellId: string | null
  likelihoodDescription: string | null
  impactDescription: string | null
}

export interface RiskAssessment {
  id: string
  type: 'INHERENT' | 'RESIDUAL'
  finalScore: number | null
  notes: string | null
  assessedAt: string
  riskLevelId: string | null
  riskLevel: { id: string; name: string; color: string | null } | null
  areaScores: AreaScore[]
}

export interface RiskTreatmentPlan {
  id: string
  impactAreaId: string | null
  impactArea: { id: string; name: string } | null
  treatmentOptionId: string | null
  treatmentOption: { id: string; name: string } | null
  description: string | null
  targetDate: string | null
  picUserId: string | null
  status: TreatmentStatus
  needsKomiteReview: boolean
  completedAt: string | null
}

export interface RiskEntry {
  id: string
  workingPaperId: string
  programFrameworkContextId: string
  assetId: string | null
  businessProcessId: string | null
  code: string
  name: string
  description: string | null
  riskCategoryId: string | null
  order: number
  createdAt: string
  updatedAt: string
  riskCategory?: RiskCategory | null
  programFrameworkContext?: RiskEntryContext
  asset?: { id: string; name: string; code: string } | null
  businessProcess?: { id: string; name: string; code: string } | null
  inherentAssessment?: RiskAssessment | null
  residualAssessment?: RiskAssessment | null
  controls?: RiskControl[]
  treatmentPlans?: RiskTreatmentPlan[]
  _count?: { controls: number; treatmentPlans: number }
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface AreaScoreInput {
  impactAreaId: string
  likelihoodLevel: number
  impactLevel: number
  likelihoodDescription?: string | null
  impactDescription?: string | null
}

export interface ControlInput {
  name: string
  description?: string | null
  effectiveness: ControlEffectiveness
  order?: number
}

export interface TreatmentPlanInput {
  impactAreaId: string
  treatmentOptionId?: string | null
  description?: string | null
  targetDate?: string | null
  picUserId?: string | null
  needsKomiteReview?: boolean
}

export interface RiskEntryCreateData {
  programFrameworkId: string
  riskContextId: string
  assetId?: string | null
  businessProcessId?: string | null
  name: string
  description?: string | null
  riskCategoryId?: string | null
  order?: number
  controls: ControlInput[]
  assessment?: {
    notes?: string | null
    areaScores: AreaScoreInput[]
  }
  treatmentPlans?: TreatmentPlanInput[]
}

export interface InherentAssessmentInput {
  notes?: string | null
  areaScores: AreaScoreInput[]
}

export interface TreatmentPlansInput {
  plans: TreatmentPlanInput[]
}

export interface RiskEntryUpdateData {
  code?: string
  name?: string
  description?: string | null
  riskCategoryId?: string | null
  order?: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const riskEntryApi = {
  listByWorkingPaper(workingPaperId: string, params?: { page?: number; limit?: number }) {
    return apiClient.get<{
      message: string
      data: RiskEntry[]
      meta: { page: number; limit: number; total: number; hasMore: boolean }
    }>(`/working-papers/${workingPaperId}/entries`, { params })
  },

  getById(entryId: string) {
    return apiClient.get<{ message: string; data: RiskEntry }>(`/entries/${entryId}`)
  },

  create(workingPaperId: string, data: RiskEntryCreateData) {
    return apiClient.post<{ message: string; data: RiskEntry }>(
      `/working-papers/${workingPaperId}/entries`,
      data,
    )
  },

  update(entryId: string, data: RiskEntryUpdateData) {
    return apiClient.patch<{ message: string; data: RiskEntry }>(`/entries/${entryId}`, data)
  },

  remove(entryId: string) {
    return apiClient.delete<{ message: string }>(`/entries/${entryId}`)
  },

  createInherentAssessment(entryId: string, data: InherentAssessmentInput) {
    return apiClient.post<{ message: string; data: RiskAssessment }>(
      `/entries/${entryId}/inherent-assessment`,
      data,
    )
  },

  createResidualAssessment(entryId: string, data: InherentAssessmentInput) {
    return apiClient.post<{ message: string; data: RiskAssessment }>(
      `/entries/${entryId}/residual-assessment`,
      data,
    )
  },

  createTreatmentPlans(entryId: string, data: TreatmentPlansInput) {
    return apiClient.post<{ message: string; data: RiskTreatmentPlan[] }>(
      `/entries/${entryId}/treatment-plans`,
      data,
    )
  },

  completeTreatmentPlan(entryId: string, planId: string, data: { areaScore: AreaScoreInput }) {
    return apiClient.post<{ message: string; data: RiskAssessment }>(
      `/entries/${entryId}/treatment-plans/${planId}/complete`,
      data,
    )
  },

  submitTreatmentPlan(entryId: string, planId: string) {
    return apiClient.patch<{ message: string; data: RiskTreatmentPlan }>(
      `/entries/${entryId}/treatment-plans/${planId}/submit`
    )
  },

  verifyTreatmentPlan(entryId: string, planId: string) {
    return apiClient.patch<{ message: string; data: { treatmentPlan: RiskTreatmentPlan; autoCreatedControl: RiskControl } }>(
      `/entries/${entryId}/treatment-plans/${planId}/verify`
    )
  },
}
