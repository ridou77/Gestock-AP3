import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { listenProducts } from "../../services/productService";
import { addStockEntry } from "../../services/stockService";
import type { Product } from "../../types/products";

export default function StockEntry() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

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
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de l'ajout."));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Administration</p>
          <h1>Entrées de stock</h1>
        </div>
      </div>
      <div className="card">
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
    </div>
  );
}
