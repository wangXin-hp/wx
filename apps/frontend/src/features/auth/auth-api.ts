export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: { id: string; username: string; displayName: string | null }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return requestAuth('/api/auth/login', { username, password }, '登录失败，请检查账号和密码')
}

export async function register(username: string, password: string): Promise<LoginResponse> {
  return requestAuth('/api/auth/register', { username, password }, '注册失败，请检查账号或密码')
}

async function requestAuth(
  path: string,
  payload: { username: string; password: string },
  fallback: string
): Promise<LoginResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join('；') : body?.message
    throw new Error(message ?? fallback)
  }

  return body as LoginResponse
}
