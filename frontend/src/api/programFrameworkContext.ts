import apiClient from './client'
import type { RiskContext } from './riskContext'

export interface ProgramFrameworkContext extends RiskContext {
  _linkId: string
  addedAt: string
}

export const programFrameworkContextApi = {
  list(programFrameworkId: string) {
    return apiClient.get<{ message: string; data: ProgramFrameworkContext[] }>(
      `/program-frameworks/${programFrameworkId}/contexts`,
    )
  },
  add(programFrameworkId: string, data: { riskContextId: string }) {
    return apiClient.post<{ message: string; data: { id: string } }>(
      `/program-frameworks/${programFrameworkId}/contexts`,
      data,
    )
  },
  remove(programFrameworkId: string, riskContextId: string) {
    return apiClient.delete<{ message: string }>(
      `/program-frameworks/${programFrameworkId}/contexts/${riskContextId}`,
    )
  },
}
