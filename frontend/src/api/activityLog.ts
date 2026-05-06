import apiClient from './client'
import type { PaginationMeta } from '@/types'

export type ActivityLogActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'AUTH'
export type ActivityLogLevel = 'notice' | 'warning' | 'info'

export interface ActivityLogItem {
  id: string
  action: string
  actionType: ActivityLogActionType
  level: ActivityLogLevel
  userId: string | null
  username: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface ActivityLogQuery {
  action?: string
  actionType?: ActivityLogActionType
  level?: ActivityLogLevel
  userId?: string
  username?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

interface ActivityLogListResponse {
  message: string
  data: ActivityLogItem[]
  pagination: PaginationMeta
}

const list = (params: ActivityLogQuery) => {
  return apiClient.get<ActivityLogListResponse>('/activity-logs', { params })
}

export const activityLogApi = { list }
