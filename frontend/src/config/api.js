// API Configuration
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  if (import.meta.env.DEV) {
    return ''
  }
  console.error('VITE_API_URL not configured!')
  return '/api'
}

export const API_BASE_URL = getApiUrl()

export const API_ENDPOINTS = {
  health: '/health',
  findRecruiters: '/api/v1/recruiters/find',
  findRecruitersAsync: '/api/v1/recruiters/find-async',
  jobStatus: (jobId) => `/api/v1/recruiters/status/${jobId}`,
  sendEmail: '/api/v1/email/send',
  sendBulkEmail: '/api/v1/email/send-bulk',
  // Backward compat
  generateLeads: '/api/v1/recruiters/find',
}
