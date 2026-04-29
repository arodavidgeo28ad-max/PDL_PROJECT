import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stresssync_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — but NOT for auth endpoints (login/register),
// so error messages can be displayed by the form itself.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('stresssync_token');
      localStorage.removeItem('stresssync_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Wellness
export const wellnessAPI = {
  submit: (data) => api.post('/wellness', data),
  history: (limit = 7) => api.get(`/wellness?limit=${limit}`),
  latest: () => api.get('/wellness/latest'),
};

// Analysis
export const analysisAPI = {
  analyze: (wellnessDataId) => api.post('/analysis/analyze', wellnessDataId ? { wellnessDataId } : {}),
  history: () => api.get('/analysis/history'),
  latest: () => api.get('/analysis/latest'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Appointments
export const appointmentsAPI = {
  list: (status) => api.get(`/appointments${status ? `?status=${status}` : ''}`),
  book: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
};

// Messages
export const messagesAPI = {
  contacts: () => api.get('/messages/contacts'),
  conversation: (userId) => api.get(`/messages/conversation/${userId}`),
  send: (data) => api.post('/messages', data),
};

// Tasks
export const tasksAPI = {
  list: (status) => api.get(`/tasks${status ? `?status=${status}` : ''}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Notifications
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all/mark'),
};

// Referrals
export const referralsAPI = {
  generate: () => api.post('/referrals/generate'),
  myReferrals: () => api.get('/referrals/my'),
  validate: (code) => api.post('/referrals/validate', { code }),
};

// Directory
export const directoryAPI = {
  mentors: () => api.get('/directory/mentors'),
  mentor: (id) => api.get(`/directory/mentors/${id}`),
  myMentor: () => api.get('/directory/my-mentor'),
  students: () => api.get('/directory/students'),
  kickout: (id) => api.post(`/directory/kickout/${id}`),
  join: (referralCode) => api.post('/directory/join', { referralCode }),
};

// Chat
export const chatAPI = {
  send: (message, history) => api.post('/chat', { message, history }),
};

export default api;
