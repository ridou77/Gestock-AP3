import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { logAudit } from "./auditService";
import type { StockMovement } from "../types/stock";

const PRODUCTS_COLLECTION = "produits";
const MOVEMENTS_COLLECTION = "mouvements";

export function listenMovements(
  onMovements: (movements: StockMovement[]) => void,
  onError?: (error: Error) => void
) {
  const movementsRef = collection(db, MOVEMENTS_COLLECTION);
  const q = query(movementsRef, orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const movements = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          type_mouvement: data.type_mouvement,
          produitId: data.produitId,
          produitNom: data.produitNom,
          quantite: data.quantite,
          utilisateur: data.utilisateur,
          date: data.date,
          orderId: data.orderId,
        } as StockMovement;
      });
      onMovements(movements);
    },
    (error) => onError?.(error)
  );
}

export async function addStockEntry(
  produitId: string,
  quantite: number,
  utilisateur: string,
  produitNom: string
) {
  const productRef = doc(db, PRODUCTS_COLLECTION, produitId);
  const movementsRef = collection(db, MOVEMENTS_COLLECTION);

  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) {
      throw new Error("Produit introuvable.");
    }
    const data = productSnap.data();
    const current = Number(data.quantite_dispo ?? 0);
    const next = current + quantite;

    transaction.update(productRef, { quantite_dispo: next, updatedAt: serverTimestamp() });
    transaction.set(doc(movementsRef), {
      type_mouvement: "Entrée",
      produitId,
      produitNom,
      quantite,
      utilisateur,
      date: serverTimestamp(),
    });
  });

  void logAudit({
    action: "creation",
    entity: "movement",
    entityId: produitId,
    userId: utilisateur,
    metadata: {
      type: "Entrée",
      produitNom,
      quantite,
    },
  }).catch((err) => console.warn("Audit ajout stock échoué:", err));
}
