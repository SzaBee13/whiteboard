import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      // Allow unsafe-eval for React Fast Refresh in development
      // and connect to Supabase for auth/realtime
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
        "font-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
      ].join('; '),
    },
  },
})
