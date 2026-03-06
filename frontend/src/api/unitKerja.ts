import apiClient from './client'

export interface UnitKerja {
  id: string
  name: string
  code: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const unitKerjaApi = {
  search(params?: { name?: string; page?: number; limit?: number }) {
    return apiClient.get<{ message: string; data: UnitKerja[]; pagination: PaginationMeta }>(
      '/unit-kerja',
      { params },
    )
  },

  create(data: { name: string; code: string; email: string }) {
    return apiClient.post<{ message: string; data: UnitKerja }>('/unit-kerja', data)
  },

  update(id: string, data: { name?: string; code?: string; email?: string }) {
    return apiClient.patch<{ message: string; data: UnitKerja }>(`/unit-kerja/${id}`, data)
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(`/unit-kerja/${id}`)
  },
}
