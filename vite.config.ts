import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import dotenv from 'dotenv'

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/asaas': {
        target: 'https://api-sandbox.asaas.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/asaas/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('access_token')
            proxyReq.removeHeader('Authorization')

            const apiKey = process.env.VITE_ASAAS_API_KEY
            if (apiKey) {
              proxyReq.setHeader('access_token', apiKey)
              console.log('🔑 [PROXY] Header access_token injetado com sucesso.')
            } else {
              console.error('❌ [PROXY] ERRO: VITE_ASAAS_API_KEY não encontrada no .env!')
            }

            proxyReq.setHeader('User-Agent', 'GF-CP-App/1.0.0')
          })
        },
      },
    },
  },
})
