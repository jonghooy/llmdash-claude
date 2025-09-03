import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  login: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ isAuthenticated: true, token, user });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ isAuthenticated: false, token: null, user: null });
  },
}));