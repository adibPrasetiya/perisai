import apiClient from './client'

export interface UserSearchParams {
  name?: string
  username?: string
  role?: string
  isActive?: boolean
  isVerified?: boolean
  page?: number
  limit?: number
}

export interface UserSession {
  isActive: boolean
  refreshToken: string
  deviceId: string
  deviceName: string | null
  ipAddress: string | null
  expiresAt: string
  lastSeenAt: string
}

export interface UserProfile {
  jabatan: string
  nomorHP: string | null
  isVerified: boolean
  verifiedAt: string | null
  unitKerja: {
    id: string
    name: string
    code: string
  }
}

export interface UserItem {
  id: string
  username: string
  name: string
  email: string
  isActive: boolean
  isVerified: boolean
  mustChangePassword: boolean
  totpEnabled: boolean
  passwordChangedAt: string | null
  passwordExpiresAt: string | null
  createdAt: string
  updatedAt: string
  roles: string[]
  profile: UserProfile | null
  session: UserSession | null
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const usersApi = {
  search(params?: UserSearchParams) {
    return apiClient.get<{ data: UserItem[]; pagination: PaginationMeta }>('/users', { params })
  },

  getById(userId: string) {
    return apiClient.get<{ message: string; data: UserItem }>(`/users/${userId}`)
  },

  verify(userId: string) {
    return apiClient.patch(`/users/${userId}/verify`)
  },

  activate(userId: string) {
    return apiClient.patch(`/users/${userId}/activate`)
  },

  deactivate(userId: string) {
    return apiClient.patch(`/users/${userId}/deactivate`)
  },

  getMyProfile() {
    return apiClient.get<{ message: string; data: UserItem }>('/users/me')
  },

  updateMyPassword(data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
    totpCode: string
  }) {
    return apiClient.patch<{ message: string }>('/users/me/password', data)
  },

  updateMyAccount(data: {
    name?: string
    email?: string
    password: string
  }) {
    return apiClient.patch<{ message: string; data: Pick<UserItem, 'id' | 'username' | 'name' | 'email' | 'updatedAt'> }>('/users/me', data)
  },

  resetTotp(userId: string, data: { password: string; totpCode: string }) {
    return apiClient.patch<{ message: string; data: { userId: string; username: string; name: string } }>(
      `/users/${userId}/reset-totp`,
      data,
    )
  },

  updateMyProfile(data: {
    jabatan?: string
    nomorHP?: string
    password: string
  }) {
    return apiClient.patch<{ message: string; data: { jabatan: string; nomorHP: string | null; unitKerja: UserProfile['unitKerja'] } }>('/users/me/profile', data)
  },

  adminUpdateUser(userId: string, data: { unitKerjaId?: string; roles?: string[] }) {
    return apiClient.patch<{ message: string; data: UserItem }>(`/users/${userId}`, data)
  },
}
