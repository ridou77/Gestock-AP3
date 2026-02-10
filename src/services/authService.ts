// src/services/authService.js
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { initializeNewUser } from "./roleService";
import type { UserData, UserRole } from "../types/roles";

export async function register(
  email: string,
  password: string,
  role: UserRole = "visiteur",
  profile?: Pick<UserData, "firstName" | "lastName" | "age">
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Initialiser le nouvel utilisateur avec le rôle spécifié
  await initializeNewUser(result.user.uid, email, role, profile);
  return result;
}

export function login(email: string , password: string ) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function changePassword(newPassword: string) {
  if (!auth.currentUser) {
    throw new Error("Aucun utilisateur connecté.");
  }
  return updatePassword(auth.currentUser, newPassword);
}
