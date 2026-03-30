import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const backendPort = env.BACKEND_PORT || env.VITE_BACKEND_PORT || '6001'
  const frontendPort = parseInt(env.VITE_FRONTEND_PORT) || 5173

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': `http://localhost:${backendPort}`
      }
    }
  }
})
