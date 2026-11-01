import { Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { AppLayout } from '../app/layouts/AppLayout'

export function createAppRoutes(onLogout: () => void): RouteObject[] {
  return [
    {
      path: '/app',
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="overview" replace /> },
        { path: '*', element: <DashboardPage onLogout={onLogout} /> },
      ],
    },
  ]
}
