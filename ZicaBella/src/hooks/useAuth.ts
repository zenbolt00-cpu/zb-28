import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setBiometric = useAuthStore((s) => s.setBiometric);
  const updateUser = useAuthStore((s) => s.updateUser);

  return {
    user,
    isAuthenticated,
    biometricEnabled,
    login,
    logout,
    setBiometric,
    updateUser,
  };
}
