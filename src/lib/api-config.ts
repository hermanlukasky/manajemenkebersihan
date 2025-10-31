// API Configuration for different environments
export const API_CONFIG = {
  // Get the current origin (browser or server)
  getOrigin(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
  },

  // Detect if app is running on preview environment (Vercel, Netlify, etc.)
  isPreviewEnvironment(): boolean {
    if (typeof window === 'undefined') return false
    const origin = window.location.origin
    return (
      origin.includes('space.z.ai') ||
      origin.includes('vercel.app') ||
      origin.includes('netlify.app') ||
      origin.includes('preview')
    )
  },

  // Base URL untuk API request
  getApiBaseUrl(): string {
    const envApi = process.env.NEXT_PUBLIC_API_URL
    if (envApi) return envApi

    const origin = this.getOrigin()

    // Jika di preview, tetap gunakan origin yang sama
    if (this.isPreviewEnvironment()) {
      return origin
    }

    // Default: lokal
    return origin
  },

  // URL WebSocket yang fleksibel dan aman
  getWebSocketUrl(): string {
    // ✅ Jika diset manual via environment variable, gunakan itu
    const envWs = process.env.NEXT_PUBLIC_WS_URL
    if (envWs) return envWs

    const origin = this.getOrigin()
    const wsProtocol = origin.startsWith('https://') ? 'wss://' : 'ws://'
    const wsOrigin = origin.replace(/^https?:\/\//, wsProtocol)

    // ⚙️ Gunakan root host tanpa "/api/socketio"
    // karena socket server di proyekmu diinisialisasi manual (src/lib/socket.ts)
    return wsOrigin
  },

  // Fungsi umum untuk melakukan API request
  async apiRequest(endpoint: string, options: RequestInit = {}) {
    const baseUrl = this.getApiBaseUrl()
    const url = `${baseUrl}${endpoint}`

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, defaultOptions)
      return response
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  },
}

// ✅ Helper untuk pemanggilan cepat
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseUrl = API_CONFIG.getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    return response
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}
