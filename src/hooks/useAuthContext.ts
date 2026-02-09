import { useContext } from "react";
import AuthContext from "../contexts/authContext";

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext doit être utilisé dans un AuthContextProvider");
    }
    return context;
}
