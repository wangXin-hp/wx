export interface Application {
  id: string
  ownerId: string
  name: string
  slug: string
  environment: 'development' | 'staging' | 'production'
  publicKey: string
  status: 'active' | 'disabled'
  description: string | null
  dsn: string
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('tracekit.accessToken') ?? sessionStorage.getItem('tracekit.accessToken')
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ?? ''}`,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.message ?? '应用请求失败')
  return body as T
}

export const listApplications = () => request<Application[]>('/applications')
export const createApplication = (
  payload: Pick<Application, 'name' | 'slug' | 'environment'> & { description?: string }
) => request<Application>('/applications', { method: 'POST', body: JSON.stringify(payload) })
export const getApplication = (id: string) => request<Application>(`/applications/${id}`)
export const updateApplication = (
  id: string,
  payload: Partial<Pick<Application, 'name' | 'description' | 'status'>>
) => request<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
export const deleteApplication = (id: string) =>
  request<{ deleted: true }>(`/applications/${id}`, { method: 'DELETE' })
export const rotateDsn = (id: string) =>
  request<Application>(`/applications/${id}/rotate-dsn`, { method: 'POST' })
export interface ApplicationOverview {
  total: number
  errors: number
  performance: number
  customEvents: number
  eventTypes: Record<string, number>
  recentEvents: Array<Record<string, unknown>>
}
export const getApplicationOverview = (id: string, environment: string) =>
  request<ApplicationOverview>(`/applications/${id}/overview?environment=${encodeURIComponent(environment)}`)
export const listApplicationEvents = (id: string, environment: string, eventType?: string) =>
  request<Array<Record<string, unknown>>>(
    `/applications/${id}/events?environment=${encodeURIComponent(environment)}${eventType ? `&eventType=${encodeURIComponent(eventType)}` : ''}`
  )
export const getApplicationTrends = (id: string, environment: string) =>
  request<Array<{ bucket: string; eventType: string; count: string }>>(
    `/applications/${id}/trends?environment=${encodeURIComponent(environment)}`
  )
