import { createContext } from "react";
import type { User } from "firebase/auth";
import type { UserData } from "../types/roles";

export type AuthContextType = {
  user: User | null;
  profile: UserData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;
