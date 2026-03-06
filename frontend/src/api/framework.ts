import apiClient from './client'

export interface Framework {
  id: string
  code: string
  name: string
  version: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { riskPrograms: number }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface FrameworkSearchParams {
  name?: string
  code?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export const frameworkApi = {
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
}
