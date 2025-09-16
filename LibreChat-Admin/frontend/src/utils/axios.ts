import axios from 'axios';

// Determine the correct base URL based on environment
const getBaseURL = () => {
  if (typeof window === 'undefined') {
    // Server side
    return 'http://localhost:5001';
  }

  const isDev = false; // For production build
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDev || isLocalhost) {
    // Development environment
    return 'http://localhost:5001';
  } else {
    // Production environment - use /admin prefix
    return '/admin';
  }
};

// Create axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage or wherever it's stored
    const token = localStorage.getItem('admin_token') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging in development
    // console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    // console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // Log errors in development
    // console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
    //   status: error.response?.status,
    //   data: error.response?.data,
    //   message: error.message
    // });

    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login or refresh token
          console.warn('Unauthorized access - clearing auth tokens');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminToken');
          
          // Don't redirect if we're already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/admin/login';
          }
          break;
          
        case 403:
          // Forbidden - show permission error
          console.warn('Access forbidden:', data?.message);
          break;
          
        case 404:
          // Not found - show appropriate message
          console.warn('Resource not found:', data?.message);
          break;
          
        case 429:
          // Rate limited
          console.warn('Rate limited:', data?.message);
          break;
          
        case 500:
          // Server error
          console.error('Server error:', data?.message);
          break;
          
        default:
          console.error('HTTP error:', status, data?.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received:', error.request);
    } else {
      // Request setup error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API service functions for model registry
export const modelRegistryAPI = {
  // Get all model registry entries
  getAll: (params?: { provider?: string; enabled?: boolean; userSelectable?: boolean }) => 
    api.get('/api/model-registry', { params }),
  
  // Get specific model registry entry
  getById: (id: string) => 
    api.get(`/api/model-registry/${id}`),
  
  // Create new model registry entry
  create: (data: any) => 
    api.post('/api/model-registry', data),
  
  // Update model registry entry
  update: (id: string, data: any) => 
    api.put(`/api/model-registry/${id}`, data),
  
  // Delete model registry entry
  delete: (id: string) => 
    api.delete(`/api/model-registry/${id}`),
  
  // Toggle enabled status
  toggleEnabled: (id: string) => 
    api.patch(`/api/model-registry/${id}/toggle-enabled`),
  
  // Get registry statistics
  getStats: () => 
    api.get('/api/model-registry/stats/summary')
};

// API service functions for model pricing
export const modelPricingAPI = {
  // Get all model pricing entries
  getAll: (params?: { provider?: string; status?: string; tier?: string }) => 
    api.get('/api/model-pricing', { params }),
  
  // Get specific model pricing entry
  getById: (id: string) => 
    api.get(`/api/model-pricing/${id}`),
  
  // Get pricing by model ID
  getByModelId: (modelId: string) => 
    api.get(`/api/model-pricing/by-model/${modelId}`),
  
  // Create new model pricing entry
  create: (data: any) => 
    api.post('/api/model-pricing', data),
  
  // Update model pricing entry
  update: (id: string, data: any) => 
    api.put(`/api/model-pricing/${id}`, data),
  
  // Delete model pricing entry
  delete: (id: string) => 
    api.delete(`/api/model-pricing/${id}`),
  
  // Update pricing status
  updateStatus: (id: string, status: string) => 
    api.patch(`/api/model-pricing/${id}/status`, { status }),
  
  // Bulk update pricing
  bulkUpdate: (updates: any[]) => 
    api.post('/api/model-pricing/bulk-update', { updates }),
  
  // Get pricing statistics
  getStats: () => 
    api.get('/api/model-pricing/stats/summary')
};

// Generic API functions
export const apiClient = {
  get: (url: string, config?: any) => api.get(url, config),
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => api.patch(url, data, config),
  delete: (url: string, config?: any) => api.delete(url, config),
};

export default api;