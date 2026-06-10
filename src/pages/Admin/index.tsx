import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listenProducts } from "../../services/productService";
import { listenAllOrders } from "../../services/orderService";
import { listenMovements } from "../../services/stockService";
import type { Product } from "../../types/products";
import type { Order } from "../../types/orders";
import type { StockMovement } from "../../types/stock";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    const unsubscribeProducts = listenProducts(setProducts);
    const unsubscribeOrders = listenAllOrders(setOrders);
    const unsubscribeMovements = listenMovements(setMovements);
    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeMovements();
    };
  }, []);

  const lowStock = useMemo(
    () => products.filter((product) => product.quantite_dispo <= product.seuil_alerte),
    [products]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.statut === "En attente"),
    [orders]
  );

  const totalStock = useMemo(
    () => products.reduce((sum, product) => sum + product.quantite_dispo, 0),
    [products]
  );

  const ordersByStatus = useMemo(() => {
    const statuses = ["En attente", "En préparation", "Expédiée", "Terminée", "Annulée"];
    return statuses.map((status) => ({
      status,
      count: orders.filter((order) => order.statut === status).length,
    }));
  }, [orders]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Administration</p>
          <h1>Dashboard admin</h1>
        </div>
      </div>

      <div className="card">
        <div className="info-grid">
          <div>
            <p className="info-label">Commandes en attente</p>
            <p className="info-value">{pendingOrders.length}</p>
          </div>
          <div>
            <p className="info-label">Produits sous seuil</p>
            <p className="info-value">{lowStock.length}</p>
          </div>
          <div>
            <p className="info-label">Stock total</p>
            <p className="info-value">{totalStock}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Actions rapides</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
          <Link className="button button-primary" to="/products">
            Catalogue
          </Link>
          <Link className="button button-primary" to="/stock">
            Entrées stock
          </Link>
          <Link className="button button-primary" to="/admin/movements">
            Mouvements
          </Link>
          <Link className="button button-primary" to="/orders/track">
            Commandes
          </Link>
          <Link className="button button-primary" to="/admin/users">
            Utilisateurs
          </Link>
          {/* <Link className="button button-primary" to="/admin/audit">
            Audit
          </Link> */}
        </div>
      </div>

      <div className="card">
        <h2>Statistiques commandes</h2>
        <div className="info-grid">
          {ordersByStatus.map((item) => (
            <div key={item.status}>
              <p className="info-label">{item.status}</p>
              <p className="info-value">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Mouvements récents</h2>
        {movements.length === 0 ? (
          <p className="helper-text">Aucun mouvement.</p>
        ) : (
          <div className="card card-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 5).map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.type_mouvement}</td>
                    <td>{movement.produitNom}</td>
                    <td>{movement.quantite}</td>
                    <td>{movement.utilisateur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
