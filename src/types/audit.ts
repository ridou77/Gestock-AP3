import type { Timestamp } from "firebase/firestore";

export type AuditAction = "connexion" | "creation" | "modification" | "suppression";

export type AuditEntity =
  | "user"
  | "product"
  | "order"
  | "stock"
  | "role"
  | "movement"
  | "auth";

export type AuditEntry = { // recu de firestore
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  timestamp?: Timestamp;
  metadata?: Record<string, unknown>;
};

export type AuditEntryInput = { // envoye à firestore
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  metadata?: Record<string, unknown>;
};
