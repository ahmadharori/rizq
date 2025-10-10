export interface User {
  id: string
  username: string
  email: string | null
  full_name: string | null
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  isLoading: boolean
}
