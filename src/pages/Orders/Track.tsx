import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import {
  adminUpdateOrderStatus,
  cancelOrder,
  listenAllOrders,
  listenUserOrders,
  updateOrderDetails,
} from "../../services/orderService";
import type { Order, OrderDetail, OrderStatus } from "../../types/orders";

const STATUS_OPTIONS: OrderStatus[] = [
  "En attente",
  "En préparation",
  "Expédiée",
  "Terminée",
  "Annulée",
];

type DraftMap = Record<string, OrderDetail[]>;

export default function OrderTrack() {
  const { user } = useAuth();
  const { isAdmin, isGestionnaire, permissions } = useRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const isStaff = isAdmin || isGestionnaire;
  const canEdit = !!permissions?.canUpdate;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const handleData = (data: Order[]) => {
      setOrders(data);
      setLoading(false);
    };
    const handleError = (err: Error) => {
      console.error("Erreur:", err);
      setError("Impossible de charger les commandes.");
      setLoading(false);
    };
    const unsubscribe = isStaff
      ? listenAllOrders(handleData, handleError)
      : listenUserOrders(user.uid, handleData, handleError);
    return () => unsubscribe();
  }, [user, isStaff]);

  const startEdit = (order: Order) => {
    setDrafts((prev) => ({
      ...prev,
      [order.id]: order.details.map((detail) => ({ ...detail })),
    }));
  };

  const updateDraft = (orderId: string, index: number, value: string) => {
    setDrafts((prev) => {
      const current = prev[orderId] ?? [];
      const updated = current.map((detail, idx) =>
        idx === index ? { ...detail, quantite: Number(value) || 0 } : detail
      );
      return { ...prev, [orderId]: updated };
    });
  };

  const saveDraft = async (orderId: string) => {
    const draft = drafts[orderId];
    if (!draft) return;
    setSaving((prev) => ({ ...prev, [orderId]: true }));
    setError(null);
    try {
      await updateOrderDetails(orderId, draft);
      setDrafts((prev) => {
        const { [orderId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setSaving((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCancel = async (orderId: string) => {
    setSaving((prev) => ({ ...prev, [orderId]: true }));
    try {
      await cancelOrder(orderId);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'annulation.");
    } finally {
      setSaving((prev) => ({ ...prev, [orderId]: false }));
    }
  };

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
          <p className="page-kicker">Commandes</p>
          <h1>{isStaff ? "Gestion des commandes" : "Suivi des commandes"}</h1>
        </div>
      </div>

      {loading ? (
        <p className="helper-text">Chargement...</p>
      ) : (
        <div className="card card-table">
          <table className="table">
            <thead>
              <tr>
                <th>Commande</th>
                {isStaff && <th>Utilisateur</th>}
                <th>Statut</th>
                <th>Détails</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={isStaff ? 5 : 4} className="table-empty">
                    Aucune commande
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const draft = drafts[order.id];
                  const isEditable =
                    canEdit && order.statut === "En attente" && order.utilisateur === user?.uid;
                  const isOwner = order.utilisateur === user?.uid;
                  return (
                    <tr key={order.id}>
                      <td>{order.id.slice(0, 6)}...</td>
                      {isStaff && <td>{order.utilisateurEmail}</td>}
                      <td>
                        {isStaff ? (
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
                        ) : (
                          order.statut
                        )}
                      </td>
                      <td>
                        {draft ? (
                          <div style={{ display: "grid", gap: "6px" }}>
                            {draft.map((detail, index) => (
                              <div key={`${detail.productId}-${index}`}>
                                {detail.nom}
                                <input
                                  className="input input-compact"
                                  type="number"
                                  min={0}
                                  value={detail.quantite}
                                  onChange={(e) => updateDraft(order.id, index, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          order.details.map((detail, index) => (
                            <div key={`${detail.productId}-${index}`}>
                              {detail.nom} — {detail.quantite}
                            </div>
                          ))
                        )}
                      </td>
                      <td className="table-actions">
                        {isEditable && !draft && (
                          <button
                            className="button button-primary button-small"
                            onClick={() => startEdit(order)}
                          >
                            Modifier
                          </button>
                        )}
                        {draft && (
                          <button
                            className="button button-primary button-small"
                            onClick={() => saveDraft(order.id)}
                            disabled={saving[order.id]}
                          >
                            {saving[order.id] ? "..." : "Enregistrer"}
                          </button>
                        )}
                        {canEdit &&
                          isOwner &&
                          order.statut !== "Terminée" &&
                          order.statut !== "Annulée" && (
                          <button
                            className="button button-danger button-small"
                            onClick={() => handleCancel(order.id)}
                            disabled={saving[order.id]}
                          >
                            {saving[order.id] ? "..." : "Annuler"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="helper-text">{error}</p>}
    </div>
  );
}
