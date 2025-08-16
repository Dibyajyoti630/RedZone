// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  
  // Admin endpoints
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  
  // RedZone endpoints
  REDZONES_RECENT: `${API_BASE_URL}/api/redzones/recent`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`
}

// Helper function to make API calls
export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  }

  const response = await fetch(endpoint, {
    ...defaultOptions,
    ...options
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
