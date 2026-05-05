import apiClient from './client'

export type ConfigDataType = 'STRING' | 'INTEGER' | 'BOOLEAN'

export interface SystemConfig {
  key: string
  value: string
  dataType: ConfigDataType
  group: string
  label: string
  description: string | null
  isEditable: boolean
  updatedAt: string
  updatedBy: string | null
}

export interface SystemConfigGroup {
  group: string
  items: SystemConfig[]
}

export const systemConfigApi = {
  getAll() {
    return apiClient.get<{ message: string; data: SystemConfigGroup[] }>('/system-config')
  },

  update(key: string, value: string) {
    return apiClient.patch<{ message: string; data: SystemConfig }>(`/system-config/${key}`, {
      value,
    })
  },
}
