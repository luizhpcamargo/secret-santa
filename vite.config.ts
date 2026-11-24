import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // The deploy workflow passes the repository name; keep the original path for local builds
  const { VITE_BASE_URL = '/secretsanta' } = loadEnv(mode, '.', 'VITE_');

  return {
    base: `${VITE_BASE_URL}/`,
    plugins: [react()],
  };
})
