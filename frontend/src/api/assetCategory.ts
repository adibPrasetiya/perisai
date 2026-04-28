import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export interface AssetCategory {
  id: string
  name: string
  description: string | null
  createdAt?: string
  updatedAt?: string
  _count?: {
    assets: number
  }
}

export const assetCategoryApi = {
  search(params?: { name?: string; page?: number; limit?: number }) {
    return apiClient.get<{ message: string; data: AssetCategory[]; pagination: PaginationMeta }>(
      '/asset-category',
      { params },
    )
  },

  create(data: { name: string; description?: string }) {
    return apiClient.post<{ message: string; data: AssetCategory }>('/asset-category', data)
  },

  update(id: string, data: { name?: string; description?: string }) {
    return apiClient.patch<{ message: string; data: AssetCategory }>(`/asset-category/${id}`, data)
  },

  remove(id: string) {
    return apiClient.delete<{ message: string }>(`/asset-category/${id}`)
  },
}
