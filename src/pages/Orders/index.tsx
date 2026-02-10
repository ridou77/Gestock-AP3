import { Link } from "react-router-dom";
import { useRole } from "../../hooks/useRole";

export default function Orders() {
  const { permissions } = useRole();
  const canCreate = !!permissions?.canCreate;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Commandes</p>
          <h1>Mes commandes</h1>
        </div>
      </div>
      <div className="card">
        <p className="helper-text">Gère tes commandes depuis cette section.</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          {canCreate && (
            <Link className="button button-primary" to="/orders/create">
              Créer une commande
            </Link>
          )}
          <Link className="button button-primary" to="/orders/track">
            Suivre mes commandes
          </Link>
        </div>
        {!canCreate && (
          <p className="helper-text" style={{ marginTop: "12px" }}>
            Votre rôle est en lecture seule : création de commande désactivée.
          </p>
        )}
      </div>
    </div>
  );
}
