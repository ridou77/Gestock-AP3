import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useRole } from "../../hooks/useRole";

type Props = { children: ReactNode };

export default function AdminRoute({ children }: Props) {
  const { loading, isAdmin } = useRole();

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
