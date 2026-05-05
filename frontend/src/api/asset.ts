import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export type AssetStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface Asset {
  id: string
  name: string
  code: string
  description: string | null
  owner: string | null
  status: AssetStatus
  createdAt: string
  updatedAt: string
  unitKerja: { id: string; name: string; code: string }
  category: { id: string; name: string }
}

export interface AssetSearchParams {
  name?: string
  code?: string
  categoryId?: string
  status?: AssetStatus | ''
  page?: number
  limit?: number
}

export const assetApi = {
  search(unitKerjaId: string, params?: AssetSearchParams) {
    return apiClient.get<{ message: string; data: Asset[]; pagination: PaginationMeta }>(
      `/unit-kerja/${unitKerjaId}/assets`,
      { params },
    )
  },

  create(
    unitKerjaId: string,
    data: { name: string; code: string; categoryId: string; description?: string; owner?: string; status?: AssetStatus },
  ) {
    return apiClient.post<{ message: string; data: Asset }>(
      `/unit-kerja/${unitKerjaId}/assets`,
      data,
    )
  },

  update(
    unitKerjaId: string,
    id: string,
    data: { name?: string; code?: string; categoryId?: string; description?: string; owner?: string },
  ) {
    return apiClient.patch<{ message: string; data: Asset }>(
      `/unit-kerja/${unitKerjaId}/assets/${id}`,
      data,
    )
  },

  activate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: Asset }>(
      `/unit-kerja/${unitKerjaId}/assets/${id}/activate`,
    )
  },

  deactivate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: Asset }>(
      `/unit-kerja/${unitKerjaId}/assets/${id}/deactivate`,
    )
  },

  archive(unitKerjaId: string, id: string) {
    return apiClient.delete<{ message: string; data: Asset }>(
      `/unit-kerja/${unitKerjaId}/assets/${id}`,
    )
  },
}
