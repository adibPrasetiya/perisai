import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export interface WorkingPaperProgram {
  id: string
  name: string
  year: number
  status: string
}

export interface WorkingPaperUnitKerja {
  id: string
  name: string
  code: string
}

export interface WorkingPaper {
  id: string
  programId: string
  unitKerjaId: string
  title: string
  status: 'DRAFT'
  createdBy: string | null
  createdAt: string
  updatedBy: string | null
  updatedAt: string
  program?: WorkingPaperProgram
  unitKerja?: WorkingPaperUnitKerja
  _count?: { riskEntries: number }
}

export interface WorkingPaperSearchParams {
  programId?: string
  year?: number
  status?: string
  page?: number
  limit?: number
}

export const WORKING_PAPER_STATUS_LABELS: Record<WorkingPaper['status'], string> = {
  DRAFT: 'Draft',
}

export interface WpStatsLevel {
  name: string
  color: string
  count: number
}

export interface WpStatsTreatmentStatus {
  status: string
  count: number
}

export interface WpStatsControlEffectiveness {
  effectiveness: string
  count: number
}

export interface WpStatsCategoryItem {
  name: string
  color: string
  count: number
}

export interface WpStatsTop5Item {
  name: string
  finalScore: number
  riskLevelName: string | null
  riskLevelColor: string
}

export interface WpStats {
  summary: {
    total: number
    withInherent: number
    withResidual: number
    notAssessed: number
    overduePlans: number
  }
  inherentLevels: WpStatsLevel[]
  residualLevels: WpStatsLevel[]
  treatmentStatuses: WpStatsTreatmentStatus[]
  controlEffectiveness: WpStatsControlEffectiveness[]
  categoryDistribution: WpStatsCategoryItem[]
  top5ByInherent: WpStatsTop5Item[]
  top5ByResidual: WpStatsTop5Item[]
}

export const workingPaperApi = {
  search(params?: WorkingPaperSearchParams) {
    return apiClient.get<{ message: string; data: WorkingPaper[]; pagination: PaginationMeta }>(
      '/working-papers',
      { params },
    )
  },

  getById(id: string) {
    return apiClient.get<{ message: string; data: WorkingPaper }>(`/working-papers/${id}`)
  },

  create(data: { programId: string; title?: string }) {
    return apiClient.post<{ message: string; data: WorkingPaper }>('/working-papers', data)
  },

  update(id: string, data: { title: string }) {
    return apiClient.patch<{ message: string; data: WorkingPaper }>(`/working-papers/${id}`, data)
  },

  getStats(workingPaperId: string) {
    return apiClient.get<{ message: string; data: WpStats }>(`/working-papers/${workingPaperId}/stats`)
  },

  downloadReport(workingPaperId: string) {
    return apiClient.get(`/working-papers/${workingPaperId}/report/pdf`, { responseType: 'blob' })
  },
}
