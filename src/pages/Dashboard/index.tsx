import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import { listenProducts } from "../../services/productService";
import { listenUserOrders } from "../../services/orderService";
import { ROLE_LABELS } from "../../types/roles";
import type { Product } from "../../types/products";
import type { Order } from "../../types/orders";

function formatDate(value?: { toDate?: () => Date }) {
  if (!value || typeof value.toDate !== "function") return "—";
  return value.toDate().toLocaleDateString("fr-FR");
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { role } = useRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setProductsLoaded(false);
    setOrdersLoaded(false);
    const unsubscribeProducts = listenProducts(
      (data) => {
        setProducts(data);
        setProductsLoaded(true);
      },
      (err) => {
        console.error("Erreur produits:", err);
        setError("Impossible de charger les produits.");
        setProductsLoaded(true);
      }
    );
    const unsubscribeOrders = listenUserOrders(
      user.uid,
      (data) => {
        setOrders(data);
        setOrdersLoaded(true);
      },
      (err) => {
        console.error("Erreur commandes:", err);
        setError("Impossible de charger les commandes.");
        setOrdersLoaded(true);
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user]);

  const lowStock = useMemo(
    () => products.filter((product) => product.quantite_dispo <= product.seuil_alerte),
    [products]
  );
  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.quantite_dispo, 0),
    [products]
  );
  const pendingOrders = useMemo(
    () => orders.filter((order) => order.statut === "En attente"),
    [orders]
  );
  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const displayName =
    profile?.firstName?.trim() || profile?.lastName?.trim()
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : user?.email ?? "";

  const loading = !productsLoaded || !ordersLoaded;
  const isActive = profile?.active !== false;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Tableau de bord</p>
          <h1>Bonjour {displayName}</h1>
        </div>
        <span className={`badge ${isActive ? "" : "badge-muted"}`}>
          {isActive ? "Compte actif" : "Compte désactivé"}
        </span>
      </div>

      {loading ? (
        <p className="helper-text">Chargement des données...</p>
      ) : error ? (
        <p className="helper-text">{error}</p>
      ) : (
        <>
          <div className="card">
            <h2>Résumé</h2>
            <div className="info-grid">
              <div>
                <p className="info-label">Produits suivis</p>
                <p className="info-value">{products.length}</p>
              </div>
              <div>
                <p className="info-label">Stock total</p>
                <p className="info-value">{totalStock}</p>
              </div>
              <div>
                <p className="info-label">Alertes sous seuil</p>
                <p className={`info-value ${lowStock.length > 0 ? "info-value-alert" : ""}`}>
                  {lowStock.length}
                </p>
              </div>
              <div>
                <p className="info-label">Commandes en attente</p>
                <p className="info-value">{pendingOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Alertes de seuil</h2>
            {lowStock.length === 0 ? (
              <p className="helper-text">Aucune alerte en cours.</p>
            ) : (
              <div className="card card-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Seuil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.slice(0, 5).map((product) => (
                      <tr key={product.id} className="row-alert">
                        <td>{product.nom}</td>
                        <td>
                          <span className="stock-pill stock-pill-danger">
                            {product.quantite_dispo}
                          </span>
                        </td>
                        <td>
                          <span className="stock-pill stock-pill-neutral">
                            {product.seuil_alerte}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Dernières commandes</h2>
            {latestOrders.length === 0 ? (
              <p className="helper-text">Aucune commande récente.</p>
            ) : (
              <div className="card card-table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Commande</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Articles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id.slice(0, 6)}...</td>
                        <td>{formatDate(order.dateCommande)}</td>
                        <td>{order.statut}</td>
                        <td>{order.details.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2>État du compte</h2>
            <div className="info-grid">
              <div>
                <p className="info-label">Email</p>
                <p className="info-value">{user?.email}</p>
              </div>
              <div>
                <p className="info-label">Rôle</p>
                <p className="info-value">{role ? ROLE_LABELS[role] : "—"}</p>
              </div>
              <div>
                <p className="info-label">Statut</p>
                <p className="info-value">{isActive ? "Actif" : "Désactivé"}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
