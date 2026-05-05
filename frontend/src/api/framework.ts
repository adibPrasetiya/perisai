import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export interface Framework {
  id: string
  code: string
  name: string
  version: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { programFrameworks: number; riskContexts: number }
}

export interface FrameworkSearchParams {
  name?: string
  code?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export const frameworkApi = {
  getById(id: string) {
    return apiClient.get<{ message: string; data: Framework }>(`/frameworks/${id}`)
  },

  search(params?: FrameworkSearchParams) {
    return apiClient.get<{ message: string; data: Framework[]; pagination: PaginationMeta }>(
      '/frameworks',
      { params },
    )
  },

  create(data: { code: string; name: string; version?: string; description?: string }) {
    return apiClient.post<{ message: string; data: Framework }>('/frameworks', data)
  },

  update(
    id: string,
    data: { code?: string; name?: string; version?: string; description?: string },
  ) {
    return apiClient.patch<{ message: string; data: Framework }>(`/frameworks/${id}`, data)
  },

  activate(id: string) {
    return apiClient.patch<{ message: string; data: Framework }>(`/frameworks/${id}/activate`)
  },

  deactivate(id: string) {
    return apiClient.patch<{ message: string; data: Framework }>(`/frameworks/${id}/deactivate`)
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(`/frameworks/${id}`)
  },

  listProgramFrameworks(frameworkId: string) {
    return apiClient.get<{ message: string; data: any[] }>(
      `/frameworks/${frameworkId}/program-frameworks`,
    )
  },
}
