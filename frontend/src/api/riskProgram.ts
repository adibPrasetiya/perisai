import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export interface ProgramFrameworkSummary {
  id: string
  frameworkId: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  framework: {
    id: string
    code: string
    name: string
    version?: string | null
  }
  _count?: { riskContexts: number }
}

export interface RiskProgram {
  id: string
  name: string
  description: string | null
  year: number
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  programFrameworks?: ProgramFrameworkSummary[]
  _count?: { programFrameworks: number }
}

export interface RiskProgramSearchParams {
  name?: string
  year?: number
  status?: string
  page?: number
  limit?: number
}

export const RISK_PROGRAM_STATUS_LABELS: Record<RiskProgram['status'], string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Aktif',
  CLOSED: 'Ditutup',
  ARCHIVED: 'Diarsipkan',
}

export const riskProgramApi = {
  search(params?: RiskProgramSearchParams) {
    return apiClient.get<{ message: string; data: RiskProgram[]; pagination: PaginationMeta }>(
      '/risk-programs',
      { params },
    )
  },

  getById(id: string) {
    return apiClient.get<{ message: string; data: RiskProgram }>(`/risk-programs/${id}`)
  },

  create(data: { name: string; description?: string; year: number }) {
    return apiClient.post<{ message: string; data: RiskProgram }>('/risk-programs', data)
  },

  update(id: string, data: { name?: string; description?: string; year?: number }) {
    return apiClient.patch<{ message: string; data: RiskProgram }>(`/risk-programs/${id}`, data)
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(`/risk-programs/${id}`)
  },

  activate(id: string) {
    return apiClient.post<{ message: string; data: RiskProgram }>(`/risk-programs/${id}/activate`)
  },

  deactivate(id: string) {
    return apiClient.post<{ message: string; data: RiskProgram }>(`/risk-programs/${id}/deactivate`)
  },

  setDraft(id: string) {
    return apiClient.post<{ message: string; data: RiskProgram }>(`/risk-programs/${id}/set-draft`)
  },
}
