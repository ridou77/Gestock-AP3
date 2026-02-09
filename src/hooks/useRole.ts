import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { listenUserData } from "../services/roleService";
import type { UserRole } from "../types/roles";
import { ROLE_PERMISSIONS } from "../types/roles";

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [active, setActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setActive(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenUserData(
      user.uid,
      (data) => {
        if (!data) {
          setRole("visiteur");
          setActive(false);
        } else {
          setRole(data.role ?? "visiteur");
          setActive(data.active !== false);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors de la récupération du rôle:", error);
        setRole("visiteur");
        setActive(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

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
