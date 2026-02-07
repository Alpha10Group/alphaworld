import type { Entity, Role, Memo, Issue, Ticket, User } from './store';

const API_BASE = '/api';

async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string, entity: Entity) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, entity }),
      }),
    
    logout: () =>
      fetchAPI('/auth/logout', { method: 'POST' }),
    
    me: () => fetchAPI('/auth/me'),
  },

  users: {
    getAll: () => fetchAPI('/users'),
    create: (user: { name: string; username: string; role: Role; email: string; phone: string }) =>
      fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    update: (id: number, updates: Partial<User>) =>
      fetchAPI(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: number) =>
      fetchAPI(`/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: number) =>
      fetchAPI(`/users/${id}/reset-password`, { method: 'POST' }),
  },

  memos: {
    getAll: () => fetchAPI('/memos'),
    getById: (id: string) => fetchAPI(`/memos/${id}`),
    create: (memo: { title: string; content: string; initiator: string; department: string; date: string; attachments: Array<{ originalName: string; url: string }> }) =>
      fetchAPI('/memos', {
        method: 'POST',
        body: JSON.stringify(memo),
      }),
    approve: (id: string, comment: string, signature: string) =>
      fetchAPI(`/memos/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ comment, signature }),
      }),
    reject: (id: string, comment: string) =>
      fetchAPI(`/memos/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ comment }),
      }),
    resubmit: (id: string, content: string, title?: string, attachments?: Array<{ originalName: string; url: string }>) =>
      fetchAPI(`/memos/${id}/resubmit`, {
        method: 'PATCH',
        body: JSON.stringify({ content, title, attachments }),
      }),
  },

  issues: {
    getAll: () => fetchAPI('/issues'),
    getById: (id: number) => fetchAPI(`/issues/${id}`),
    create: (issue: { title: string; description: string; cost: string; cause: string; date: string; department: string; assignedTo: Role[]; attachments: Array<{ originalName: string; url: string }> }) =>
      fetchAPI('/issues', {
        method: 'POST',
        body: JSON.stringify(issue),
      }),
    review: (id: number, comment: string) =>
      fetchAPI(`/issues/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ comment }),
      }),
  },

  tickets: {
    getAll: () => fetchAPI('/tickets'),
    getById: (id: number) => fetchAPI(`/tickets/${id}`),
    create: (ticket: { title: string; priority: string; description: string; assignedTo: string; attachments: Array<{ originalName: string; url: string }> }) =>
      fetchAPI('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket),
      }),
    updateStatus: (id: number, status: string, comment?: string) =>
      fetchAPI(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comment }),
      }),
  },

  auditLogs: {
    getAll: () => fetchAPI('/audit-logs'),
  },

  notificationSettings: {
    get: () => fetchAPI('/notification-settings'),
    update: (settings: any) =>
      fetchAPI('/notification-settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
  },
};
