// API Configuration for different environments
export const API_CONFIG = {
  // Get the current origin
  getOrigin(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
  },

  // Determine if we're in preview environment
  isPreviewEnvironment(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    const origin = window.location.origin
    return origin.includes('space.z.ai') || 
           origin.includes('vercel.app') || 
           origin.includes('netlify.app') ||
           origin.includes('preview')
  },

  // Get API base URL
  getApiBaseUrl(): string {
    const origin = this.getOrigin()
    
    // If we're in preview environment, we need to use the same origin
    if (this.isPreviewEnvironment()) {
      return origin
    }
    
    // For local development, use the local server
    return origin
  },

  // Get WebSocket URL
  getWebSocketUrl(): string {
    const origin = this.getOrigin()
    
    if (this.isPreviewEnvironment()) {
      // Convert https to wss and http to ws
      const wsProtocol = origin.startsWith('https://') ? 'wss://' : 'ws://'
      const wsOrigin = origin.replace(/^https?:\/\//, wsProtocol)
      return wsOrigin + '/api/socketio'
    }
    
    const wsProtocol = origin.startsWith('https://') ? 'wss://' : 'ws://'
    const wsOrigin = origin.replace(/^http:\/\//, wsProtocol)
    return wsOrigin + '/api/socketio'
  },

  // Make API requests
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
  }
}

// Helper function to make API requests
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