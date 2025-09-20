import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  saasRole: 'super_admin' | 'customer_admin' | 'team_leader' | 'user';
  tenantId?: string;
  tenantName?: string;
  teamId?: string;
  subscription?: {
    plan: string;
    status: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isSuperAdmin: () => boolean;
  isCustomerAdmin: () => boolean;
  isTeamLeader: () => boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isSuperAdmin: () => {
    const { user } = get();
    return user?.saasRole === 'super_admin';
  },
  isCustomerAdmin: () => {
    const { user } = get();
    return user?.saasRole === 'customer_admin';
  },
  isTeamLeader: () => {
    const { user } = get();
    return user?.saasRole === 'team_leader';
  },
  login: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ isAuthenticated: true, token, user });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ isAuthenticated: false, token: null, user: null });
  },
}));