import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderDetail, OrderStatus } from "../types/orders";

const ORDERS_COLLECTION = "commandes";
const PRODUCTS_COLLECTION = "produits";
const MOVEMENTS_COLLECTION = "mouvements";

export function listenUserOrders(
  userId: string,
  onOrders: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, where("utilisateur", "==", userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Order))
        .sort((a, b) => {
          const aTime = typeof a.dateCommande?.toMillis === "function" ? a.dateCommande.toMillis() : 0;
          const bTime = typeof b.dateCommande?.toMillis === "function" ? b.dateCommande.toMillis() : 0;
          return bTime - aTime;
        });
      onOrders(orders);
    },
    (error) => onError?.(error)
  );
}

export function listenAllOrders(
  onOrders: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, orderBy("dateCommande", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Order));
      onOrders(orders);
    },
    (error) => onError?.(error)
  );
}

export async function createOrder(
  utilisateur: string,
  utilisateurEmail: string,
  details: OrderDetail[]
) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  if (details.length === 0) {
    throw new Error("La commande est vide.");
  }

  await runTransaction(db, async (transaction) => {
    for (const item of details) {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error("Produit introuvable.");
      }
      const data = productSnap.data();
      const stock = Number(data.quantite_dispo ?? 0);
      if (item.quantite > stock) {
        throw new Error("Quantité demandée supérieure au stock.");
      }
    }

    const orderRef = doc(ordersRef);
    transaction.set(orderRef, {
      utilisateur,
      utilisateurEmail,
      dateCommande: serverTimestamp(),
      statut: "En attente",
      details,
      stockProcessed: false,
    });
  });
}

export async function updateOrderDetails(
  orderId: string,
  details: OrderDetail[],
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  if (details.length === 0) {
    throw new Error("La commande est vide.");
  }
  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    if (!actor?.isAdmin && actor?.userId && order.utilisateur !== actor.userId) {
      throw new Error("Commande non autorisée.");
    }
    if (order.statut !== "En attente") {
      throw new Error("Commande non modifiable.");
    }
    for (const item of details) {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error("Produit introuvable.");
      }
      const data = productSnap.data();
      const stock = Number(data.quantite_dispo ?? 0);
      if (item.quantite > stock) {
        throw new Error("Quantité demandée supérieure au stock.");
      }
    }
    transaction.update(orderRef, {
      details,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function cancelOrder(
  orderId: string,
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    if (!actor?.isAdmin && actor?.userId && order.utilisateur !== actor.userId) {
      throw new Error("Commande non autorisée.");
    }
    if (order.statut === "Annulée") {
      throw new Error("Commande déjà annulée.");
    }
    if (order.statut === "Terminée") {
      throw new Error("Commande terminée non annulable.");
    }
    if (order.stockProcessed) {
      const stockUpdates: Array<{ productRef: ReturnType<typeof doc>; stock: number; item: OrderDetail }> = [];
      for (const item of order.details) {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) {
          throw new Error("Produit introuvable.");
        }
        const data = productSnap.data();
        const stock = Number(data.quantite_dispo ?? 0);
        stockUpdates.push({ productRef, stock, item });
      }

      for (const { productRef, stock, item } of stockUpdates) {
        transaction.update(productRef, {
          quantite_dispo: stock + item.quantite,
          updatedAt: serverTimestamp(),
        });

        const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));
        transaction.set(movementRef, {
          type_mouvement: "Entrée",
          produitId: item.productId,
          produitNom: item.nom,
          quantite: item.quantite,
          utilisateur: order.utilisateur,
          date: serverTimestamp(),
          orderId,
        });
      }
    }

    transaction.update(orderRef, {
      statut: "Annulée",
      updatedAt: serverTimestamp(),
      stockProcessed: order.stockProcessed ? false : order.stockProcessed,
    });
  });
}

export async function deleteOrder(
  orderId: string,
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    if (!actor?.isAdmin && actor?.userId && order.utilisateur !== actor.userId) {
      throw new Error("Commande non autorisée.");
    }
    if (order.stockProcessed) {
      throw new Error("Commande non supprimable (stock traité).");
    }
    if (!["En attente", "Annulée"].includes(order.statut)) {
      throw new Error("Commande non supprimable.");
    }
    transaction.delete(orderRef);
  });
}

export async function adminUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    if (!actor?.isAdmin && actor?.userId && order.utilisateur !== actor.userId) {
      throw new Error("Commande non autorisée.");
    }
    const shouldProcessStock =
      order.statut === "En attente" &&
      ["En préparation", "Expédiée", "Terminée"].includes(newStatus) &&
      !order.stockProcessed;

    if (shouldProcessStock) {
      const stockUpdates: Array<{ productRef: ReturnType<typeof doc>; stock: number; item: OrderDetail }> = [];
      for (const item of order.details) {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.productId);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) {
          throw new Error("Produit introuvable.");
        }
        const data = productSnap.data();
        const stock = Number(data.quantite_dispo ?? 0);
        if (item.quantite > stock) {
          throw new Error("Stock insuffisant pour valider la commande.");
        }
        stockUpdates.push({ productRef, stock, item });
      }

      for (const { productRef, stock, item } of stockUpdates) {
        transaction.update(productRef, {
          quantite_dispo: stock - item.quantite,
          updatedAt: serverTimestamp(),
        });

        const movementRef = doc(collection(db, MOVEMENTS_COLLECTION));
        transaction.set(movementRef, {
          type_mouvement: "Sortie",
          produitId: item.productId,
          produitNom: item.nom,
          quantite: item.quantite,
          utilisateur: order.utilisateur,
          date: serverTimestamp(),
          orderId,
        });
      }
    }

    transaction.update(orderRef, {
      statut: newStatus,
      updatedAt: serverTimestamp(),
      stockProcessed: order.stockProcessed || shouldProcessStock,
    });
  });
}
