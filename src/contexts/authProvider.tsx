import AuthContext, { type AuthContextType } from "./authContext";
import { useState, useEffect, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../services/firebase";

type Props = { children: ReactNode };

export default function AuthContextProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: AuthContextType = {
        user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
