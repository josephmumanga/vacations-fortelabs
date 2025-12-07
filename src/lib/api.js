// API Client for Azure Functions
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data = null;
      
      // Only try to parse JSON if content exists and is JSON
      if (isJson) {
        const text = await response.text();
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error(`Failed to parse response: ${parseError.message}`);
          }
        }
      } else {
        // For non-JSON responses, read as text to get error message
        const text = await response.text();
        if (text.trim()) {
          data = { error: text };
        }
      }

      if (!response.ok) {
        let errorMessage = data?.error || data?.message;
        
        // Provide specific messages for common HTTP errors
        if (!errorMessage) {
          if (response.status === 404) {
            // Check if we're in development mode
            const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
            if (isDev) {
              errorMessage = `API endpoint not found (404). Make sure Azure Functions is running:\n1. Open a terminal\n2. Run: cd api && func start\n3. Wait for Functions to start on http://localhost:7071`;
            } else {
              errorMessage = `API endpoint not found (404). Please check if the API is properly deployed.`;
            }
          } else if (response.status === 500) {
            errorMessage = `Internal server error (500). Please try again later.`;
          } else if (response.status === 0 || response.status === 'ECONNREFUSED') {
            const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
            if (isDev) {
              errorMessage = `Cannot connect to API. Azure Functions is not running.\n\nTo start it:\n1. Open a terminal\n2. Run: cd api && func start\n3. Wait for Functions to start on http://localhost:7071`;
            } else {
              errorMessage = `Cannot connect to API server. Please check if the API is properly deployed.`;
            }
          } else {
            errorMessage = `HTTP error! status: ${response.status}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      return { data, error: null };
    } catch (error) {
      console.error('API request error:', error);
      
      // Handle network errors (when Azure Functions isn't running)
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ECONNREFUSED'))) {
        const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
        if (isDev) {
          const networkError = new Error(`Cannot connect to Azure Functions API.\n\nMake sure Azure Functions is running:\n1. Open a terminal\n2. Run: cd api && func start\n3. Wait for Functions to start on http://localhost:7071`);
          return { data: null, error: networkError };
        }
      }
      
      // If it's already an Error object, use it; otherwise create one
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return { data: null, error: errorObj };
    }
  }

  // Authentication methods (Magic Link)
  async signUp(email, name, role) {
    const { data, error } = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, name, role }),
    });

    // Magic link flow doesn't return token immediately
    // Token will be set after verification via verifyMagicLink
    return { data, error };
  }

  async signIn(email) {
    const { data, error } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    // Magic link flow doesn't return token immediately
    // Token will be set after verification via verifyMagicLink
    return { data, error };
  }

  async getSession() {
    const token = this.getToken();
    if (!token) {
      return { data: { session: null }, error: null };
    }

    const { data, error } = await this.request('/auth/session', {
      method: 'GET',
    });

    if (error || !data) {
      this.setToken(null);
      return { data: { session: null }, error };
    }

    return {
      data: {
        session: {
          user: data.user,
          access_token: token,
        },
      },
      error: null,
    };
  }

  async signOut() {
    this.setToken(null);
    return { data: null, error: null };
  }

  // Magic Link methods
  async requestMagicLink(email) {
    return await this.request('/auth/magic-link-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token) {
    const { data, error } = await this.request(`/auth-verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    if (data && data.token) {
      this.setToken(data.token);
    }

    return { data, error };
  }

  // Password Reset methods
  async requestPasswordReset(email) {
    return await this.request('/auth/password-reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token, newPassword) {
    return await this.request('/auth/password-reset-confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Profile methods
  async getProfile(userId = null) {
    const endpoint = userId ? `/profiles/get?userId=${userId}` : '/profiles/get';
    return await this.request(endpoint, { method: 'GET' });
  }

  async updateProfile(updates) {
    return await this.request('/profiles/update', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async listProfiles() {
    return await this.request('/profiles/list', { method: 'GET' });
  }

  // Request methods
  async getRequests() {
    return await this.request('/requests/get', { method: 'GET' });
  }

  async createRequest(requestData) {
    return await this.request('/requests/create', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateRequest(requestId, updates) {
    return await this.request('/requests/update', {
      method: 'PUT',
      body: JSON.stringify({ id: requestId, ...updates }),
    });
  }

  async approveRequest(requestId, action, comment = '') {
    return await this.request('/requests/approve', {
      method: 'POST',
      body: JSON.stringify({ id: requestId, action, comment }),
    });
  }
}

// Create a singleton instance
export const api = new ApiClient();

// Export auth methods for compatibility
export const auth = {
  signUp: (credentials) => api.signUp(credentials.email, credentials.password, credentials.name, credentials.role),
  signInWithPassword: (credentials) => api.signIn(credentials.email, credentials.password),
  signOut: () => api.signOut(),
  getSession: () => api.getSession(),
  onAuthStateChange: (callback) => {
    // Simple implementation - check session periodically
    let currentToken = api.getToken();
    
    const checkAuth = async () => {
      const newToken = api.getToken();
      if (newToken !== currentToken) {
        currentToken = newToken;
        const { data } = await api.getSession();
        callback(newToken ? 'SIGNED_IN' : 'SIGNED_OUT', data?.session || null);
      }
    };

    // Check immediately
    checkAuth();
    
    // Check every 5 seconds
    const interval = setInterval(checkAuth, 5000);

    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => clearInterval(interval),
        },
      },
    };
  },
};

// Export database methods for compatibility
export const from = (table) => {
  return {
    select: (columns) => {
      return {
        eq: (column, value) => {
          // This is a simplified query builder
          // For complex queries, we'll use the direct API methods
          return {
            single: async () => {
              if (table === 'profiles') {
                const { data, error } = await api.getProfile(value);
                return { data, error };
              }
              return { data: null, error: new Error('Not implemented') };
            },
            then: async (callback) => {
              const result = await this.single();
              return callback(result);
            },
          };
        },
        order: (column, options = {}) => {
          return {
            then: async (callback) => {
              if (table === 'vacation_requests') {
                const { data, error } = await api.getRequests();
                if (error) {
                  return callback({ data: null, error });
                }
                // Simple sorting - in production, this should be done server-side
                const sorted = [...(data || [])].sort((a, b) => {
                  const aVal = a[column];
                  const bVal = b[column];
                  if (options.ascending === false) {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                  }
                  return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                });
                return callback({ data: sorted, error: null });
              }
              return callback({ data: null, error: new Error('Not implemented') });
            },
          };
        },
      };
    },
    insert: async (data) => {
      if (table === 'vacation_requests') {
        return await api.createRequest(Array.isArray(data) ? data[0] : data);
      }
      return { data: null, error: new Error('Not implemented') };
    },
    update: (updates) => {
      return {
        eq: (column, value) => {
          return {
            then: async (callback) => {
              if (table === 'vacation_requests') {
                const { data, error } = await api.updateRequest(value, updates);
                return callback({ data, error });
              } else if (table === 'profiles') {
                const { data, error } = await api.updateProfile({ userId: value, ...updates });
                return callback({ data, error });
              }
              return callback({ data: null, error: new Error('Not implemented') });
            },
          };
        },
      };
    },
    upsert: async (data, options = {}) => {
      if (table === 'profiles') {
        const { data: result, error } = await api.updateProfile(data);
        if (error) {
          // If update fails, try to create
          // This is a simplified version - in production, handle this better
          return { data: null, error };
        }
        return { data: result, error: null };
      }
      return { data: null, error: new Error('Not implemented') };
    },
  };
};

// Default export for compatibility
export default api;

