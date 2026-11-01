/** 统一请求层：注入 Token、解析响应，并统一转换后端错误。 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('tracekit.accessToken') ?? sessionStorage.getItem('tracekit.accessToken')
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (response.status === 401) {
    localStorage.removeItem('tracekit.accessToken')
    sessionStorage.removeItem('tracekit.accessToken')
  }
  if (!response.ok)
    throw new Error(Array.isArray(body?.message) ? body.message.join('；') : (body?.message ?? '请求失败'))
  return body as T
}
