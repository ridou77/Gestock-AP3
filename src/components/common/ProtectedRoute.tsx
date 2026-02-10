import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
    const { user, loading } = useAuth();
    const { active, loading: roleLoading } = useRole();

    if (loading || roleLoading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (!active) return <Navigate to="/login" replace />;

    return <>{children}</>;
}
