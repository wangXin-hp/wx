import { createBrowserRouter } from 'react-router-dom'
import { createAppRoutes } from './routes'

export const createRouter = (onLogout: () => void) => createBrowserRouter(createAppRoutes(onLogout))
