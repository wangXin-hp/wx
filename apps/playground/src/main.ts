import './style.css'

import { renderApp } from './app'

const app = document.querySelector<HTMLElement>('#app')

if (!app) {
  throw new Error('Playground root element #app was not found.')
}

renderApp(app)
