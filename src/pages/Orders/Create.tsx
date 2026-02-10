import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import { listenProducts } from "../../services/productService";
import { createOrder } from "../../services/orderService";
import type { Product } from "../../types/products";

type CartItem = {
  product: Product;
  quantite: number;
};

export default function OrderCreate() {
  const { user } = useAuth();
  const { permissions } = useRole();
  const canCreate = !!permissions?.canCreate;
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = listenProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const addToCart = (product: Product) => {
    const value = quantities[product.id];
    const quantite = value ? Number(value) : 0;
    if (!Number.isFinite(quantite) || quantite <= 0) {
      setError("Quantité invalide.");
      return;
    }
    if (quantite > product.quantite_dispo) {
      setError("Quantité supérieure au stock.");
      return;
    }
    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantite } : item
        );
      }
      return [...prev, { product, quantite }];
    });
  };

  const updateCartQuantity = (productId: string, value: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantite: Number(value) || 0 }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const submitOrder = async () => {
    if (!user) return;
    if (cart.length === 0) {
      setError("Ajoute au moins un produit.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await createOrder(
        user.uid,
        user.email ?? "",
        cart.map((item) => ({
          productId: item.product.id,
          nom: item.product.nom,
          quantite: item.quantite,
        }))
      );
      setCart([]);
      setQuantities({});
      setSuccess("Commande créée.");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <p className="page-kicker">Commandes</p>
            <h1>Création de commande</h1>
          </div>
        </div>
        <div className="card">
          <p className="helper-text">
            Votre rôle est en lecture seule. La création de commande est désactivée.
          </p>
          <div style={{ marginTop: "16px" }}>
            <Link className="button button-primary" to="/orders/track">
              Voir mes commandes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Commandes</p>
          <h1>Créer une commande</h1>
        </div>
      </div>

      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Stock</th>
              <th>Quantité</th>
              <th>Action</th>
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
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.nom}</td>
                  <td>{product.quantite_dispo}</td>
                  <td>
                    <input
                      className="input input-compact"
                      type="number"
                      min={0}
                      max={product.quantite_dispo}
                      value={quantities[product.id] ?? ""}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="button button-primary button-small"
                      onClick={() => addToCart(product)}
                    >
                      Ajouter
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Panier</h2>
        {cart.length === 0 ? (
          <p className="helper-text">Aucun produit ajouté.</p>
        ) : (
          <div className="card card-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product.id}>
                    <td>{item.product.nom}</td>
                    <td>
                      <input
                        className="input input-compact"
                        type="number"
                        min={0}
                        max={item.product.quantite_dispo}
                        value={item.quantite}
                        onChange={(e) => updateCartQuantity(item.product.id, e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="button button-danger button-small"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        Retirer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button className="button button-primary" onClick={submitOrder} disabled={saving}>
            {saving ? "Envoi..." : "Valider la commande"}
          </button>
        </div>
        {error && <p className="helper-text">{error}</p>}
        {success && <p className="helper-text">{success}</p>}
      </div>
    </div>
  );
}
