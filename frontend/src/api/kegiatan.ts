import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type { PaginationMeta }

export type KegiatanStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface Kegiatan {
  id: string
  name: string
  code: string
  description: string | null
  owner: string | null
  status: KegiatanStatus
  createdAt: string
  updatedAt: string
  unitKerja: { id: string; name: string; code: string }
}

export interface KegiatanSearchParams {
  name?: string
  code?: string
  status?: KegiatanStatus | ''
  page?: number
  limit?: number
}

export const KegiatanApi = {
  search(unitKerjaId: string, params?: KegiatanSearchParams) {
    return apiClient.get<{ message: string; data: Kegiatan[]; pagination: PaginationMeta }>(
      `/unit-kerja/${unitKerjaId}/kegiatan`,
      { params },
    )
  },

  create(
    unitKerjaId: string,
    data: { name: string; code: string; description?: string; owner?: string; status?: KegiatanStatus },
  ) {
    return apiClient.post<{ message: string; data: Kegiatan }>(
      `/unit-kerja/${unitKerjaId}/kegiatan`,
      data,
    )
  },

  update(
    unitKerjaId: string,
    id: string,
    data: { name?: string; code?: string; description?: string; owner?: string },
  ) {
    return apiClient.patch<{ message: string; data: Kegiatan }>(
      `/unit-kerja/${unitKerjaId}/kegiatan/${id}`,
      data,
    )
  },

  activate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: Kegiatan }>(
      `/unit-kerja/${unitKerjaId}/kegiatan/${id}/activate`,
    )
  },

  deactivate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: Kegiatan }>(
      `/unit-kerja/${unitKerjaId}/kegiatan/${id}/deactivate`,
    )
  },

  archive(unitKerjaId: string, id: string) {
    return apiClient.delete<{ message: string; data: Kegiatan }>(
      `/unit-kerja/${unitKerjaId}/kegiatan/${id}`,
    )
  },
}

