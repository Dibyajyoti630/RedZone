// API Configuration
// Use the actual IP address instead of localhost for cross-device access
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://10.151.242.108:5004'

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  ME: `${API_BASE_URL}/api/auth/me`,
  
  // Admin endpoints
  ADMIN_STATS: `${API_BASE_URL}/api/admin/stats`,
  ADMIN_USER_CONTACTS: `${API_BASE_URL}/api/admin/user-contacts`,
  ADMIN_APPROVE_CONTACT_REMOVAL: (id) => `${API_BASE_URL}/api/admin/user-contacts/${id}/approve-removal`,
  ADMIN_REJECT_CONTACT_REMOVAL: (id) => `${API_BASE_URL}/api/admin/user-contacts/${id}/reject-removal`,
  ADMIN_PENDING_CONTACT_REMOVALS: `${API_BASE_URL}/api/admin/pending-contact-removals`,
  
  // User endpoints
  UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
  UPDATE_NOTIFICATION_PREFS: `${API_BASE_URL}/api/users/notification-preferences`,
  
  // RedZone endpoints
  REDZONES_RECENT: `${API_BASE_URL}/api/redzones/recent`,
  REDZONES_ALL: `${API_BASE_URL}/api/redzones`,
  REDZONES_CREATE: `${API_BASE_URL}/api/redzones`,
  REDZONES_APPROVE: (id) => `${API_BASE_URL}/api/redzones/${id}/approve`,
  REDZONES_REJECT: (id) => `${API_BASE_URL}/api/redzones/${id}/reject`,
  REDZONES_SAFE_NOW: (id) => `${API_BASE_URL}/api/redzones/${id}/safe-now`,
  USER_CONTACT_REQUEST_REMOVAL: `${API_BASE_URL}/api/user-contacts/me/request-removal`,
  USER_CONTACT_NOTIFY: `${API_BASE_URL}/api/user-contacts/notify`,
  USER_CONTACT_ME: `${API_BASE_URL}/api/user-contacts/me`,
  
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`)
  }
  
  return await response.json()
}
