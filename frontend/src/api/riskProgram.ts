import apiClient from './client'

export interface RiskProgram {
  id: string
  name: string
  description: string | null
  year: number
  frameworkId: string
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  framework?: {
    id: string
    code: string
    name: string
    version?: string | null
  }
  _count?: { contexts: number }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface RiskProgramSearchParams {
  name?: string
  year?: number
  frameworkId?: string
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

  create(data: {
    name: string
    description?: string
    year: number
    frameworkId: string
    status?: string
  }) {
    return apiClient.post<{ message: string; data: RiskProgram }>('/risk-programs', data)
  },

  update(
    id: string,
    data: {
      name?: string
      description?: string
      year?: number
      frameworkId?: string
      status?: string
    },
  ) {
    return apiClient.patch<{ message: string; data: RiskProgram }>(`/risk-programs/${id}`, data)
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(`/risk-programs/${id}`)
  },
}
