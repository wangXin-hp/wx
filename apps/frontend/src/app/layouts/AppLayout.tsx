import { Outlet } from 'react-router-dom'

/** 应用级布局入口，公共导航和权限边界集中在此层维护。 */
export function AppLayout() {
  return <Outlet />
}
