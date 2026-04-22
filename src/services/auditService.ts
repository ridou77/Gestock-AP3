import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AuditEntry, AuditEntryInput } from "../types/audit";

const AUDIT_COLLECTION = "audit";

function cleanUndefined<T extends Record<string, unknown>>(payload: T): T {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
}

export async function logAudit(entry: AuditEntryInput) {
  const currentUser = auth?.currentUser ?? null;
  const payload = cleanUndefined({
    ...entry,
    userId: entry.userId ?? currentUser?.uid,
    userEmail: entry.userEmail ?? currentUser?.email ?? undefined,
    userRole: entry.userRole,
    timestamp: serverTimestamp(),
  });

  return addDoc(collection(db, AUDIT_COLLECTION), payload);
}

export function listenAudit(
  onAudit: (entries: AuditEntry[]) => void,
  onError?: (error: Error) => void
) {
  const auditRef = collection(db, AUDIT_COLLECTION);
  const q = query(auditRef, orderBy("timestamp", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as AuditEntry)
      );
      onAudit(entries);
    },
    (error) => onError?.(error)
  );
}
