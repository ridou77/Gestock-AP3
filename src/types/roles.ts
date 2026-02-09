// Types pour la gestion des rôles utilisateurs

export type UserRole = "admin" | "gestionnaire" | "visiteur";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  age?: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const ROLES = {
  ADMIN: "admin" as UserRole,
  GESTIONNAIRE: "gestionnaire" as UserRole,
  VISITEUR: "visiteur" as UserRole,
};

export const ROLE_LABELS = {
  admin: "👑 Administrateur",
  gestionnaire: "📦 Gestionnaire de stock",
  visiteur: "👁️ Visiteur (lecture seule)",
};

export const ROLE_PERMISSIONS = {
  admin: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canManageUsers: true,
  },
  gestionnaire: {
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canManageUsers: false,
  },
  visiteur: {
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canManageUsers: false,
  },
};
