export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; username: string; displayName: string | null }
}
import { request } from '../../utils/request'

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function register(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
