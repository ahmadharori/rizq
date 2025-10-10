import api from './api'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    const response = await api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}
