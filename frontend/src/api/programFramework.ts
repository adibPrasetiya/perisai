import apiClient from './client'

export interface ProgramFramework {
  id: string
  programId: string
  frameworkId: string
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
  createdBy: string | null
  updatedBy: string | null
  framework: {
    id: string
    code: string
    name: string
    version?: string | null
    description?: string | null
  }
  _count?: { programFrameworkContexts: number }
}

export const PROGRAM_FRAMEWORK_STATUS_LABELS: Record<ProgramFramework['status'], string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak Aktif',
  ARCHIVED: 'Diarsipkan',
}

export const programFrameworkApi = {
  listByProgram(programId: string) {
    return apiClient.get<{ message: string; data: ProgramFramework[] }>(
      `/risk-programs/${programId}/frameworks`,
    )
  },

  getById(programId: string, id: string) {
    return apiClient.get<{ message: string; data: ProgramFramework }>(
      `/risk-programs/${programId}/frameworks/${id}`,
    )
  },

  add(programId: string, data: { frameworkId: string }) {
    return apiClient.post<{ message: string; data: ProgramFramework }>(
      `/risk-programs/${programId}/frameworks`,
      data,
    )
  },

  update(programId: string, id: string, data: { status?: string }) {
    return apiClient.patch<{ message: string; data: ProgramFramework }>(
      `/risk-programs/${programId}/frameworks/${id}`,
      data,
    )
  },

  remove(programId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      `/risk-programs/${programId}/frameworks/${id}`,
    )
  },
}
