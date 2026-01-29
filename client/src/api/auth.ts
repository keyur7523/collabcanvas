import { api } from './client';
import type { User } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getGoogleAuthUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/google`);
  const data = await response.json();
  return data.url;
}

export async function getGithubAuthUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/github`);
  const data = await response.json();
  return data.url;
}

export async function getCurrentUser(): Promise<User> {
  return api.get<User>('/api/auth/me');
}

export async function refreshTokens(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  return api.post('/api/auth/refresh', { refresh_token: refreshToken }, { skipAuth: true });
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout');
}
