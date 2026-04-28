import apiClient from './client'

export interface RiskContext {
  id: string
  name: string
  code: string
  description?: string | null
  frameworkId: string
  contextType: 'ASSET' | 'PROCESS'
  periodStart: number
  periodEnd: number
  matrixRows: number
  matrixCols: number
  isSystemDefault: boolean
  riskAppetiteLevel?: string | null
  riskAppetiteDescription?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  _count?: {
    riskCategories: number
    impactAreas: number
    likelihoodCriteria: number
    treatmentOptions: number
    riskLevels: number
    matrixCells: number
  }
}

export interface RiskLevel {
  id: string
  name: string
  description?: string | null
  minScore: number
  maxScore: number
  color?: string | null
  order: number
}

export interface RiskCategory {
  id: string
  name: string
  description?: string | null
  color?: string | null
  code?: string | null
  order: number
}

export interface LikelihoodCriteria {
  id: string
  level: number
  name: string
  description?: string | null
  score: number
}

export interface ImpactArea {
  id: string
  name: string
  description?: string | null
  order: number
  impactCriteria: ImpactCriteria[]
  likelihoodCriteria: LikelihoodCriteria[]
}

export interface ImpactCriteria {
  id: string
  level: number
  name: string
  description?: string | null
  score: number
}

export interface TreatmentOption {
  id: string
  name: string
  description?: string | null
  isAcceptance: boolean
  order: number
}

export interface MatrixCell {
  id: string
  row: number
  col: number
  value: number
  label?: string | null
  color?: string | null
}

export interface RiskContextDetail extends RiskContext {
  framework: { id: string; code: string; name: string; version?: string | null }
  riskCategories: RiskCategory[]
  impactAreas: ImpactArea[]
  treatmentOptions: TreatmentOption[]
  riskLevels: RiskLevel[]
  matrixCells: MatrixCell[]
  contextAssets: { id: string; asset: { id: string; name: string; code: string; status: string } }[]
  contextProcesses: { id: string; process: { id: string; name: string; code: string; status: string } }[]
}

export const RISK_CONTEXT_STATUS_LABELS: Record<RiskContext['status'], string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak Aktif',
  ARCHIVED: 'Diarsipkan',
}

export const CONTEXT_TYPE_LABELS: Record<RiskContext['contextType'], string> = {
  ASSET: 'Aset',
  PROCESS: 'Proses Bisnis',
}

export const riskContextApi = {
  createFull(
    frameworkId: string,
    data: {
      name: string
      code: string
      description?: string
      contextType: string
      periodStart: number
      periodEnd: number
      matrixRows: number
      matrixCols: number
      riskAppetiteLevel?: string
      riskAppetiteDescription?: string
      riskLevels?: { name: string; description?: string; minScore: number; maxScore: number; color?: string; order: number }[]
      matrixCells?: { row: number; col: number; value: number; label?: string; color?: string }[]
      treatmentOptions?: { name: string; description?: string; order: number }[]
    },
  ) {
    return apiClient.post<{ message: string; data: RiskContext }>(
      `/frameworks/${frameworkId}/contexts/full`,
      data,
    )
  },

  listByFramework(frameworkId: string) {
    return apiClient.get<{ message: string; data: RiskContext[] }>(
      `/frameworks/${frameworkId}/contexts`,
    )
  },

  getById(contextId: string) {
    return apiClient.get<{ message: string; data: RiskContextDetail }>(
      `/contexts/${contextId}`,
    )
  },

  update(
    contextId: string,
    data: Partial<{
      name: string
      code: string
      description: string
      contextType: string
      periodStart: number
      periodEnd: number
      matrixRows: number
      matrixCols: number
      riskAppetiteLevel: string
      riskAppetiteDescription: string
    }>,
  ) {
    return apiClient.patch<{ message: string; data: RiskContext }>(
      `/contexts/${contextId}`,
      data,
    )
  },

  remove(contextId: string) {
    return apiClient.delete<{ message: string }>(`/contexts/${contextId}`)
  },

  activate(contextId: string) {
    return apiClient.patch<{ message: string; data: RiskContext }>(
      `/contexts/${contextId}/activate`,
    )
  },

  deactivate(contextId: string) {
    return apiClient.patch<{ message: string; data: RiskContext }>(
      `/contexts/${contextId}/deactivate`,
    )
  },

  // ─── Categories ─────────────────────────────────────────────────────────────

  createCategory(
    contextId: string,
    data: { name: string; description?: string; color?: string; code?: string; order?: number },
  ) {
    return apiClient.post<{ message: string; data: RiskCategory }>(
      `/contexts/${contextId}/categories`,
      data,
    )
  },

  updateCategory(
    contextId: string,
    categoryId: string,
    data: Partial<{ name: string; description: string; color: string; code: string; order: number }>,
  ) {
    return apiClient.patch<{ message: string; data: RiskCategory }>(
      `/contexts/${contextId}/categories/${categoryId}`,
      data,
    )
  },

  removeCategory(contextId: string, categoryId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/categories/${categoryId}`,
    )
  },

  // ─── Likelihood Criteria (nested under impact area) ─────────────────────────

  createLikelihoodCriteria(
    contextId: string,
    areaId: string,
    data: { level: number; name: string; description?: string },
  ) {
    return apiClient.post<{ message: string; data: LikelihoodCriteria }>(
      `/contexts/${contextId}/impact-areas/${areaId}/likelihood-criteria`,
      data,
    )
  },

  updateLikelihoodCriteria(
    contextId: string,
    areaId: string,
    criteriaId: string,
    data: Partial<{ name: string; description: string }>,
  ) {
    return apiClient.patch<{ message: string; data: LikelihoodCriteria }>(
      `/contexts/${contextId}/impact-areas/${areaId}/likelihood-criteria/${criteriaId}`,
      data,
    )
  },

  removeLikelihoodCriteria(contextId: string, areaId: string, criteriaId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/impact-areas/${areaId}/likelihood-criteria/${criteriaId}`,
    )
  },

  // ─── Impact Areas ───────────────────────────────────────────────────────────

  createImpactArea(
    contextId: string,
    data: { name: string; description?: string; order?: number },
  ) {
    return apiClient.post<{ message: string; data: ImpactArea }>(
      `/contexts/${contextId}/impact-areas`,
      data,
    )
  },

  updateImpactArea(
    contextId: string,
    areaId: string,
    data: Partial<{ name: string; description: string; order: number }>,
  ) {
    return apiClient.patch<{ message: string; data: ImpactArea }>(
      `/contexts/${contextId}/impact-areas/${areaId}`,
      data,
    )
  },

  removeImpactArea(contextId: string, areaId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/impact-areas/${areaId}`,
    )
  },

  // ─── Impact Criteria ────────────────────────────────────────────────────────

  createImpactCriteria(
    contextId: string,
    areaId: string,
    data: { level: number; name: string; description?: string },
  ) {
    return apiClient.post<{ message: string; data: ImpactCriteria }>(
      `/contexts/${contextId}/impact-areas/${areaId}/criteria`,
      data,
    )
  },

  updateImpactCriteria(
    contextId: string,
    areaId: string,
    criteriaId: string,
    data: Partial<{ name: string; description: string }>,
  ) {
    return apiClient.patch<{ message: string; data: ImpactCriteria }>(
      `/contexts/${contextId}/impact-areas/${areaId}/criteria/${criteriaId}`,
      data,
    )
  },

  removeImpactCriteria(contextId: string, areaId: string, criteriaId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/impact-areas/${areaId}/criteria/${criteriaId}`,
    )
  },

  // ─── Treatment Options ──────────────────────────────────────────────────────

  createTreatmentOption(
    contextId: string,
    data: { name: string; description?: string; isAcceptance?: boolean; order?: number },
  ) {
    return apiClient.post<{ message: string; data: TreatmentOption }>(
      `/contexts/${contextId}/treatment-options`,
      data,
    )
  },

  updateTreatmentOption(
    contextId: string,
    optionId: string,
    data: Partial<{ name: string; description: string; isAcceptance: boolean; order: number }>,
  ) {
    return apiClient.patch<{ message: string; data: TreatmentOption }>(
      `/contexts/${contextId}/treatment-options/${optionId}`,
      data,
    )
  },

  removeTreatmentOption(contextId: string, optionId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/treatment-options/${optionId}`,
    )
  },

  // ─── Risk Levels ────────────────────────────────────────────────────────────

  listRiskLevels(contextId: string) {
    return apiClient.get<{ message: string; data: RiskLevel[] }>(
      `/contexts/${contextId}/risk-levels`,
    )
  },

  createRiskLevel(
    contextId: string,
    data: { name: string; description?: string; minScore: number; maxScore: number; color?: string; order?: number },
  ) {
    return apiClient.post<{ message: string; data: RiskLevel }>(
      `/contexts/${contextId}/risk-levels`,
      data,
    )
  },

  updateRiskLevel(
    contextId: string,
    levelId: string,
    data: Partial<{ name: string; description: string; minScore: number; maxScore: number; color: string; order: number }>,
  ) {
    return apiClient.patch<{ message: string; data: RiskLevel }>(
      `/contexts/${contextId}/risk-levels/${levelId}`,
      data,
    )
  },

  removeRiskLevel(contextId: string, levelId: string) {
    return apiClient.delete<{ message: string }>(
      `/contexts/${contextId}/risk-levels/${levelId}`,
    )
  },

  bulkSetRiskLevels(
    contextId: string,
    data: { levels: { name: string; description?: string; minScore: number; maxScore: number; color?: string; order: number }[] },
  ) {
    return apiClient.put<{ message: string; data: RiskLevel[] }>(
      `/contexts/${contextId}/risk-levels`,
      data,
    )
  },

  // ─── Matrix ─────────────────────────────────────────────────────────────────

  setMatrix(
    contextId: string,
    data: { cells: { row: number; col: number; value: number; label?: string; color?: string }[] },
  ) {
    return apiClient.put<{ message: string; data: MatrixCell[] }>(
      `/contexts/${contextId}/matrix`,
      data,
    )
  },
}
