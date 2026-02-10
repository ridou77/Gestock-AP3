import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import {
  listenProducts,
  listenStockTypes,
  createProduct,
  updateProduct,
  deleteProduct,
  createStockType,
  updateStockType,
  deleteStockType,
} from "../../services/productService";
import type { Product, StockType } from "../../types/products";

type ProductDraft = {
  nom: string;
  description: string;
  typeStockId: string;
  quantite_dispo: string;
  seuil_alerte: string;
};

export default function Products() {
  const { user } = useAuth();
  const { permissions } = useRole();
  const canManage = !!permissions?.canCreate;
  const canEdit = !!permissions?.canUpdate;
  const canDelete = !!permissions?.canDelete;
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<StockType[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [typeName, setTypeName] = useState("");
  const [typeDrafts, setTypeDrafts] = useState<Record<string, string>>({});
  const [productDrafts, setProductDrafts] = useState<Record<string, ProductDraft>>({});
  const [form, setForm] = useState<ProductDraft>({
    nom: "",
    description: "",
    typeStockId: "",
    quantite_dispo: "",
    seuil_alerte: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeProducts = listenProducts(setProducts);
    const unsubscribeTypes = listenStockTypes(setTypes);
    return () => {
      unsubscribeProducts();
      unsubscribeTypes();
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.nom.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter ? product.typeStockId === typeFilter : true;
      const isLow = product.quantite_dispo <= product.seuil_alerte;
      return matchesSearch && matchesType && (!onlyLowStock || isLow);
    });
  }, [products, search, typeFilter, onlyLowStock]);

  const typeMap = useMemo(() => {
    return types.reduce<Record<string, string>>((acc, type) => {
      acc[type.id] = type.nom;
      return acc;
    }, {});
  }, [types]);

  const handleCreateType = async () => {
    if (!user || !typeName.trim()) return;
    await createStockType(typeName.trim(), user.uid);
    setTypeName("");
  };

  const handleSaveType = async (type: StockType) => {
    const draft = typeDrafts[type.id];
    if (!draft) return;
    await updateStockType(type.id, draft.trim());
    setTypeDrafts((prev) => {
      const { [type.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleCreateProduct = async () => {
    if (!user) return;
    setError(null);
    try {
      const quantite = Number(form.quantite_dispo);
      const seuil = Number(form.seuil_alerte);
      await createProduct({
        nom: form.nom.trim(),
        description: form.description.trim(),
        typeStockId: form.typeStockId,
        quantite_dispo: Number.isFinite(quantite) ? quantite : 0,
        seuil_alerte: Number.isFinite(seuil) ? seuil : 0,
        createdBy: user.uid,
      });
      setForm({
        nom: "",
        description: "",
        typeStockId: "",
        quantite_dispo: "",
        seuil_alerte: "",
      });
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de créer le produit.");
    }
  };

  const buildDraft = (product: Product): ProductDraft => ({
    nom: product.nom,
    description: product.description,
    typeStockId: product.typeStockId,
    quantite_dispo: String(product.quantite_dispo),
    seuil_alerte: String(product.seuil_alerte),
  });

  const getDraft = (product: Product) => productDrafts[product.id] ?? buildDraft(product);

  const updateDraft = (product: Product, patch: Partial<ProductDraft>) => {
    setProductDrafts((prev) => {
      const current = prev[product.id] ?? buildDraft(product);
      return { ...prev, [product.id]: { ...current, ...patch } };
    });
  };

  const handleSaveProduct = async (product: Product) => {
    const draft = productDrafts[product.id];
    if (!draft) return;
    setError(null);
    try {
      await updateProduct(product.id, {
        nom: draft.nom.trim(),
        description: draft.description.trim(),
        typeStockId: draft.typeStockId,
        quantite_dispo: Number(draft.quantite_dispo) || 0,
        seuil_alerte: Number(draft.seuil_alerte) || 0,
      });
      setProductDrafts((prev) => {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de mettre à jour le produit.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Catalogue</p>
          <h1>Produits</h1>
        </div>
      </div>

      <div className="card">
        <div className="form-grid">
          <input
            className="input"
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nom}
              </option>
            ))}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
            />
            <span>Afficher sous le seuil</span>
          </label>
        </div>
      </div>

      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Seuil</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Aucun produit
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isLow = product.quantite_dispo <= product.seuil_alerte;
                return (
                  <tr key={product.id} onClick={() => setSelected(product)}>
                    <td>{product.nom}</td>
                    <td>{typeMap[product.typeStockId] ?? "—"}</td>
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

      {selected && (
        <div className="card">
          <h2>Fiche produit</h2>
          <p className="helper-text">Nom : {selected.nom}</p>
          <p className="helper-text">Description : {selected.description}</p>
          <p className="helper-text">Type : {typeMap[selected.typeStockId] ?? "—"}</p>
          <p className="helper-text">Quantité disponible : {selected.quantite_dispo}</p>
          <p className="helper-text">Seuil d'alerte : {selected.seuil_alerte}</p>
        </div>
      )}

      {canManage && (
        <div className="card">
          <h2>Gestion du catalogue</h2>
          <div className="form-grid">
            <input
              className="input"
              type="text"
              placeholder="Nom du type"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />
            <div className="form-actions">
              <button className="button button-primary" onClick={handleCreateType}>
                Ajouter le type
              </button>
            </div>
          </div>
          <div className="card card-table" style={{ marginTop: "16px" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="table-empty">
                      Aucun type
                    </td>
                  </tr>
                ) : (
                  types.map((type) => (
                    <tr key={type.id}>
                      <td>
                        <input
                          className="input input-compact"
                          value={typeDrafts[type.id] ?? type.nom}
                          onChange={(e) =>
                            setTypeDrafts((prev) => ({ ...prev, [type.id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="table-actions">
                        <button
                          className="button button-primary button-small"
                          onClick={() => handleSaveType(type)}
                        >
                          Enregistrer
                        </button>
                        <button
                          className="button button-danger button-small"
                          onClick={() => deleteStockType(type.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canManage && (
        <div className="card">
          <h2>Ajouter un produit</h2>
          <div className="form-grid">
            <input
              className="input"
              type="text"
              placeholder="Nom"
              value={form.nom}
              onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
            />
            <input
              className="input"
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <select
              className="input"
              value={form.typeStockId}
              onChange={(e) => setForm((prev) => ({ ...prev, typeStockId: e.target.value }))}
            >
              <option value="">Type de stock</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              placeholder="Quantité dispo"
              value={form.quantite_dispo}
              onChange={(e) => setForm((prev) => ({ ...prev, quantite_dispo: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              placeholder="Seuil d'alerte"
              value={form.seuil_alerte}
              onChange={(e) => setForm((prev) => ({ ...prev, seuil_alerte: e.target.value }))}
            />
            <div className="form-actions">
              <button className="button button-primary" onClick={handleCreateProduct}>
                Créer
              </button>
            </div>
          </div>
          {error && <p className="helper-text">{error}</p>}
        </div>
      )}

      {canManage && (
        <div className="card card-table">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Quantité</th>
                <th>Seuil</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Aucun produit
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const draft = getDraft(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <input
                          className="input input-compact"
                          value={draft.nom}
                          onChange={(e) => updateDraft(product, { nom: e.target.value })}
                          disabled={!canEdit}
                        />
                        <input
                          className="input input-compact"
                          value={draft.description}
                          onChange={(e) => updateDraft(product, { description: e.target.value })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td>
                        <select
                          className="input-select"
                          value={draft.typeStockId}
                          onChange={(e) => updateDraft(product, { typeStockId: e.target.value })}
                          disabled={!canEdit}
                        >
                          <option value="">Type</option>
                          {types.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.nom}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="input input-compact"
                          type="number"
                          value={draft.quantite_dispo}
                          onChange={(e) => updateDraft(product, { quantite_dispo: e.target.value })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td>
                        <input
                          className="input input-compact"
                          type="number"
                          value={draft.seuil_alerte}
                          onChange={(e) => updateDraft(product, { seuil_alerte: e.target.value })}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="table-actions">
                        <button
                          className="button button-primary button-small"
                          onClick={() => handleSaveProduct(product)}
                          disabled={!canEdit}
                        >
                          Enregistrer
                        </button>
                        <button
                          className="button button-danger button-small"
                          onClick={() => deleteProduct(product.id)}
                          disabled={!canDelete}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
