import type { Course, Path, Progress, User, Assignment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3008/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

export async function api<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// Typed API methods
export const coursesApi = {
  list: (token?: string) => api<{ courses: Course[]; total: number }>('/courses', { token }),
  get: (id: string, token?: string) => api<{ course: Course }>(`/courses/${id}`, { token }),
  create: (data: Partial<Course>, token: string) => 
    api<{ courseId: string }>('/courses', { method: 'POST', body: data, token }),
  update: (id: string, data: Partial<Course>, token: string) => 
    api<{ course: Course }>(`/courses/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: string, token: string) => 
    api<{ message: string }>(`/courses/${id}`, { method: 'DELETE', token }),
};

export const pathsApi = {
  list: (token?: string) => api<{ paths: Path[]; total: number }>('/paths', { token }),
  get: (id: string, token?: string) => api<{ path: Path }>(`/paths/${id}`, { token }),
  create: (data: { title: string; description?: string; courseIds: string[] }, token: string) => 
    api<{ pathId: string }>('/paths', { method: 'POST', body: data, token }),
  start: (pathId: string, token: string) => 
    api<{ enrollmentId: string }>('/paths/start', { method: 'POST', body: { pathId }, token }),
  myPaths: (token: string) => api<{ paths: any[] }>('/paths/my-paths', { token }),
  progress: (id: string, token: string) => api<any>(`/paths/${id}/progress`, { token }),
};

export const assignmentsApi = {
  get: (id: string, token: string) =>
    api<{ assignment: Assignment }>(`/assignments/${id}`, { token }),
};

export const progressApi = {
  enroll: (courseId: string, token: string) => 
    api<{ progressId: string }>('/progress/enroll', { method: 'POST', body: { courseId }, token }),
  myCourses: (token: string) => api<{ courses: any[] }>('/progress/my-courses', { token }),
    get: (courseId: string, token: string) => api<{ progress: Progress }>(`/progress/${courseId}`, { token }),
  completeResource: (data: { courseId: string; resourceId: string; resourceType: 'video' | 'document' }, token: string) =>
    api<{ message: string }>('/progress/complete-resource', { method: 'POST', body: data, token }),
    submitMcq: (data: { courseId: string; assignmentId: string; answers: number[] }, token: string) =>
    api<{ score: number; correctCount: number; totalQuestions: number }>(
      '/progress/submit-mcq',
      { method: 'POST', body: data, token }
    ),
  submitSubjective: (data: { courseId: string; assignmentId: string; answers: string[] }, token: string) =>
    api<{ message: string }>(
      '/progress/submit-subjective',
      { method: 'POST', body: data, token }
    ),
};

export const usersApi = {
  setRole: (role: 'student' | 'coach', token: string) =>
    api<{ message: string; role: string }>('/users/set-role', { 
      method: 'POST', 
      body: { role }, 
      token 
    }),
  me: (token: string) =>
    api<{ user: User }>('/users/me', { token }),
};
