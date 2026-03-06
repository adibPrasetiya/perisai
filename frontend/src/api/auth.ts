import apiClient from './client'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface TotpInitPayload {
  totpToken: string
}

export interface TotpVerifyPayload {
  totpToken: string
  code: string
}

export interface RegisterPayload {
  username: string
  name: string
  email: string
  password: string
  jabatan: string
  unitKerjaId: string
  nomorHP?: string
}

export const authApi = {
  register(payload: RegisterPayload) {
    return apiClient.post('/users', payload)
  },

  login(payload: LoginPayload) {
    return apiClient.post('/auth/login', payload)
  },

  totpSetupInit(payload: TotpInitPayload) {
    return apiClient.post('/auth/totp/setup/init', payload)
  },

  totpSetupVerify(payload: TotpVerifyPayload) {
    return apiClient.post('/auth/totp/setup/verify', payload)
  },

  totpVerify(payload: TotpVerifyPayload) {
    return apiClient.post('/auth/totp/verify', payload)
  },

  forgotPassword(payload: { identifier: string }) {
    return apiClient.post('/auth/forgot-password', payload)
  },

  resetPassword(payload: { resetToken: string; code: string; newPassword: string; confirmPassword: string }) {
    return apiClient.post('/auth/forgot-password/verify', payload)
  },

  logout() {
    return apiClient.post('/auth/logout')
  },
}
