import { useAuth } from "../hooks/useAuth";
import { useRole } from "../hooks/useRole";
import { ROLE_LABELS } from "../types/roles";

export default function Dashboard() {
    const { user } = useAuth();
    const { role } = useRole();

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <p className="page-kicker">Tableau de bord</p>
                    <h1>Bonjour {user?.email}</h1>
                </div>
                <div className="badge">{role ? ROLE_LABELS[role] : "Chargement..."}</div>
            </div>

            <div className="card">
                <h2>Vos informations</h2>
                <div className="info-grid">
                    <div>
                        <p className="info-label">Email</p>
                        <p className="info-value">{user?.email}</p>
                    </div>
                    <div>
                        <p className="info-label">Rôle</p>
                        <p className="info-value">{role ? ROLE_LABELS[role] : "Chargement..."}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
