import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import { listenProducts } from "../../services/productService";
import { addStockEntry } from "../../services/stockService";
import type { Product } from "../../types/products";

export default function Stock() {
  const { user } = useAuth();
  const { permissions } = useRole();
  const canManage = !!permissions?.canUpdate;
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    const selected = products.find((product) => product.id === productId);
    if (!selected) {
      setError("Sélectionne un produit.");
      return;
    }
    const value = Number(quantity);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Quantité invalide.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await addStockEntry(selected.id, value, user.uid, selected.nom);
      setMessage("Stock ajouté.");
      setQuantity("");
      setProductId("");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Stock</p>
          <h1>État du stock</h1>
        </div>
      </div>
      {canManage && (
        <div className="card">
          <h2>Ajouter du stock</h2>
          <div className="form-grid">
            <select
              className="input"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Produit</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.nom}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              placeholder="Quantité"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <div className="form-actions">
              <button className="button button-primary" onClick={handleSubmit}>
                Ajouter
              </button>
            </div>
          </div>
          {message && <p className="helper-text">{message}</p>}
          {error && <p className="helper-text">{error}</p>}
        </div>
      )}
      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Seuil</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  Aucun produit
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isLow = product.quantite_dispo <= product.seuil_alerte;
                return (
                  <tr key={product.id}>
                    <td>{product.nom}</td>
                    <td>{product.quantite_dispo}</td>
                    <td>{product.seuil_alerte}</td>
                    <td>
                      <span className={`badge ${isLow ? "badge-muted" : ""}`}>
                        {isLow ? "Sous seuil" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
