import { useAuth } from "./useAuth";
import type { UserRole } from "../types/roles";
import { ROLE_PERMISSIONS } from "../types/roles";

export function useRole() {
  const { user, profile, loading } = useAuth();
  const role: UserRole | null = profile?.role ?? (user ? "visiteur" : null);
  const active = profile?.active !== false && !!user;

  const permissions = role ? ROLE_PERMISSIONS[role] : null;

  return {
    role,
    loading,
    permissions,
    active,
    isAdmin: role === "admin" && active,
    isGestionnaire: role === "gestionnaire" && active,
    isVisiteur: role === "visiteur" && active,
  };
}
