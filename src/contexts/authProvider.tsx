import AuthContext, { type AuthContextType } from "./authContext";
import { useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../services/firebase";
import type { UserData } from "../types/roles";
import { listenUserData } from "../services/roleService";

type Props = { children: ReactNode };

export default function AuthContextProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeProfile: (() => void) | null = null;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setProfile(null);

            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (currentUser) {
                unsubscribeProfile = listenUserData(
                    currentUser.uid,
                    (data) => {
                        setProfile(data);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Erreur profil:", error);
                        setProfile(null);
                        setLoading(false);
                    }
                );
            } else {
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) {
                unsubscribeProfile();
            }
        };
    }, []);

    const value: AuthContextType = {
        user,
        profile,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
