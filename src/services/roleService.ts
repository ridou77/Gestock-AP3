// Service pour gérer les rôles utilisateurs dans Firestore
import { db } from "./firebase";
import {
    doc,
    setDoc,
    collection,
    updateDoc,
    onSnapshot,
} from "firebase/firestore";
import { logAudit } from "./auditService";
import type { UserRole, UserData } from "../types/roles";

const USERS_COLLECTION = "users";

// Écouter le profil complet d'un utilisateur
export function listenUserData(
    uid: string,
    onData: (data: UserData | null) => void,
    onError?: (error: Error) => void
) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    return onSnapshot(
        userRef,
        (userDoc) => {
            if (userDoc.exists()) {
                const data = userDoc.data() as UserData;
                onData({
                    ...data,
                    active: data.active !== false,
                });
            } else {
                onData(null);
            }
        },
        (error) => {
            onError?.(error);
        }
    );
}

// Mettre à jour des informations utilisateur (profil ou rôle)
export async function updateUser(uid: string, data: Partial<UserData>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const payload: Partial<UserData> = {
        ...data,
        updatedAt: new Date(),
    };

    // Firestore refuse undefined
    Object.keys(payload).forEach((key) => {
        if (payload[key as keyof UserData] === undefined) {
            delete payload[key as keyof UserData];
        }
    });

    await updateDoc(userRef, payload);
    void logAudit({
        action: "modification",
        entity: "user",
        entityId: uid,
        metadata: {
            updatedFields: Object.keys(data),
        },
    }).catch((err) => console.warn("Audit update user échoué:", err));
}


// Écouter tous les utilisateurs en temps réel (admin)
export function listenAllUsers(
    onUsers: (users: UserData[]) => void,
    onError?: (error: Error) => void
) {
    const usersRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
        usersRef,
        (snapshot) => {
            const users = snapshot.docs.map((docSnapshot) => {
                const data = docSnapshot.data();
                return {
                    uid: data.uid || docSnapshot.id,
                    email: data.email || "email@inconnu.com",
                    role: data.role || "visiteur",
                    firstName: data.firstName,
                    lastName: data.lastName,
                    age: typeof data.age === "number" ? data.age : null,
                    active: data.active !== false,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                } as UserData;
            });
            onUsers(users);
        },
        (error) => {
            onError?.(error);
        }
    );
}

// Initialiser un nouvel utilisateur avec le rôle spécifié
export async function initializeNewUser(
    uid: string,
    email: string,
    role: UserRole = "visiteur",
    profile?: Pick<UserData, "firstName" | "lastName" | "age">
): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, {
        uid,
        email,
        role,
        firstName: profile?.firstName ?? "",
        lastName: profile?.lastName ?? "",
        age: profile?.age ?? null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    void logAudit({
        action: "creation",
        entity: "user",
        entityId: uid,
        userId: uid,
        userEmail: email,
        userRole: role,
        metadata: {
            firstName: profile?.firstName ?? "",
            lastName: profile?.lastName ?? "",
            age: profile?.age ?? null,
        },
    }).catch((err) => console.warn("Audit creation user échoué:", err));
}
