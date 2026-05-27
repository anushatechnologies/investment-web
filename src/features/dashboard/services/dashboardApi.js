import { request } from '../../../services/api';

export function fetchDashboard() {
  return request('/api/dashboard', { auth: true });
}
