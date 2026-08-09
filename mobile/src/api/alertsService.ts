import { request } from './client';
import type { Alert } from './types';

export async function getAlerts(): Promise<Alert[]> {
  return request<Alert[]>('/alerts', { method: 'GET' });
}
