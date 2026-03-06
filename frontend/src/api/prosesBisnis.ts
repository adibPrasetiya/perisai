import apiClient from './client'

export type ProsesBisnisStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface ProsesBisnis {
  id: string
  name: string
  code: string
  description: string | null
  owner: string | null
  status: ProsesBisnisStatus
  createdAt: string
  updatedAt: string
  unitKerja: { id: string; name: string; code: string }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProsesBisnisSearchParams {
  name?: string
  code?: string
  status?: ProsesBisnisStatus | ''
  page?: number
  limit?: number
}

export const prosesBisnisApi = {
  search(unitKerjaId: string, params?: ProsesBisnisSearchParams) {
    return apiClient.get<{ message: string; data: ProsesBisnis[]; pagination: PaginationMeta }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis`,
      { params },
    )
  },

  create(
    unitKerjaId: string,
    data: { name: string; code: string; description?: string; owner?: string; status?: ProsesBisnisStatus },
  ) {
    return apiClient.post<{ message: string; data: ProsesBisnis }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis`,
      data,
    )
  },

  update(
    unitKerjaId: string,
    id: string,
    data: { name?: string; code?: string; description?: string; owner?: string },
  ) {
    return apiClient.patch<{ message: string; data: ProsesBisnis }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis/${id}`,
      data,
    )
  },

  activate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: ProsesBisnis }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis/${id}/activate`,
    )
  },

  deactivate(unitKerjaId: string, id: string) {
    return apiClient.patch<{ message: string; data: ProsesBisnis }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis/${id}/deactivate`,
    )
  },

  archive(unitKerjaId: string, id: string) {
    return apiClient.delete<{ message: string; data: ProsesBisnis }>(
      `/unit-kerja/${unitKerjaId}/proses-bisnis/${id}`,
    )
  },
}
