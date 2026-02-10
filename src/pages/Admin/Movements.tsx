import { useEffect, useState } from "react";
import { listenMovements } from "../../services/stockService";
import type { StockMovement } from "../../types/stock";

export default function Movements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value?: { toDate?: () => Date }) => {
    if (!value || typeof value.toDate !== "function") return "—";
    return value.toDate().toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    const unsubscribe = listenMovements(
      setMovements,
      () => setError("Impossible de charger les mouvements.")
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Administration</p>
          <h1>Mouvements de stock</h1>
        </div>
      </div>
      {error && <p className="helper-text">{error}</p>}
      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Utilisateur</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Aucun mouvement
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.type_mouvement}</td>
                  <td>{movement.produitNom}</td>
                  <td>{movement.quantite}</td>
                  <td>{movement.utilisateur}</td>
                  <td>{formatDate(movement.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
