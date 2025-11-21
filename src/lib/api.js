import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Users
export const usersAPI = {
  create: (data) => api.post("/users", data),
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Questions
export const questionsAPI = {
  getAll: (params) => api.get("/questions", { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post("/questions", data),
  bulkCreate: (questions) => api.post("/questions/bulk", { questions }),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
};

// Exams
export const examsAPI = {
  getAll: (params) => api.get("/exams", { params }),
  getById: (id) => api.get(`/exams/${id}`),
  getQuestions: (id) => api.get(`/exams/${id}/questions`),
  create: (data) => api.post("/exams", data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
};

// Exam Assignments
export const assignmentsAPI = {
  getAll: (params) => api.get("/exam-assignments", { params }),
  getById: (id) => api.get(`/exam-assignments/${id}`),
  create: (data) => api.post("/exam-assignments", data),
  bulkCreate: (data) => api.post("/exam-assignments/bulk", data),
  update: (id, data) => api.put(`/exam-assignments/${id}`, data),
  delete: (id) => api.delete(`/exam-assignments/${id}`),
};

// Sessions API
export const sessionsAPI = {
  getAll: () => api.get("/exam-sessions"),
  getById: (sessionId) => api.get(`/exam-sessions/${sessionId}`),
  start: (assignmentId) => api.post("/exam-sessions/start", assignmentId),
  resume: (sessionId) => api.post(`/exam-sessions/resume/${sessionId}`),
  submit: (sessionId) => api.post(`/exam-sessions/${sessionId}/submit`),
};

// Submitted Answers API
export const submittedAnswersAPI = {
  create: ({ sessionId, questionId, submittedValue }) =>
    api.post("/submitted-answers", {
      sessionId,
      questionId,
      submittedValue,
    }),

  getBySession: (sessionId) =>
    api.get(`/submitted-answers/session/${sessionId}`),

  getAll: () => api.get("/submitted-answers"),
};

// Grades
export const gradesAPI = {
  getAll: (params) => api.get("/grades", { params }),
  getById: (id) => api.get(`/grades/${id}`),
  getBySession: (sessionId) => api.get(`/grades/session/${sessionId}`),
  create: (sessionId) => api.post("/grades", { sessionId }),
  update: (id, data) => api.put(`/grades/${id}`, data),
  delete: (id) => api.delete(`/grades/${id}`),
};

// Activity Logs
export const logsAPI = {
  getAll: (params) => api.get("/activity-logs", { params }),
  getMine: (params) => api.get("/activity-logs/me", { params }),
  getById: (id) => api.get(`/activity-logs/${id}`),
  delete: (id) => api.delete(`/activity-logs/${id}`),
};

export default api;
