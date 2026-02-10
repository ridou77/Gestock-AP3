import { useEffect, useState } from "react";
import { adminUpdateOrderStatus, listenAllOrders } from "../../services/orderService";
import type { Order, OrderStatus } from "../../types/orders";

const STATUS_OPTIONS: OrderStatus[] = [
  "En attente",
  "En préparation",
  "Expédiée",
  "Terminée",
  "Annulée",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const formatDate = (value?: { toDate?: () => Date }) => {
    if (!value || typeof value.toDate !== "function") return "—";
    return value.toDate().toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    const unsubscribe = listenAllOrders(setOrders, () =>
      setError("Impossible de charger les commandes.")
    );
    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setSaving((prev) => ({ ...prev, [orderId]: true }));
    setError(null);
    try {
      await adminUpdateOrderStatus(orderId, status);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setSaving((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Administration</p>
          <h1>Commandes globales</h1>
        </div>
      </div>
      {error && <p className="helper-text">{error}</p>}
      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Utilisateur</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Aucune commande
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.slice(0, 6)}...</td>
                  <td>{order.utilisateurEmail}</td>
                  <td>{formatDate(order.dateCommande)}</td>
                  <td>
                    <select
                      className="input-select"
                      value={order.statut}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      disabled={saving[order.id]}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {order.details.map((detail, index) => (
                      <div key={`${detail.productId}-${index}`}>
                        {detail.nom} — {detail.quantite}
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
