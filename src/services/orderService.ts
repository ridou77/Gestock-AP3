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
import { logAudit } from "./auditService";
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
  const orderRef = doc(ordersRef);
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

    transaction.set(orderRef, {
      utilisateur,
      utilisateurEmail,
      dateCommande: serverTimestamp(),
      statut: "En attente",
      details,
      stockProcessed: false,
    });
  });

  void logAudit({
    action: "creation",
    entity: "order",
    entityId: orderRef.id,
    userId: utilisateur,
    userEmail: utilisateurEmail,
    metadata: {
      items: details.length,
    },
  }).catch((err) => console.warn("Audit création commande échouée:", err));
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

  void logAudit({
    action: "modification",
    entity: "order",
    entityId: orderId,
    userId: actor?.userId,
    metadata: {
      items: details.length,
    },
  }).catch((err) => console.warn("Audit modification commande échouée:", err));
}

export async function cancelOrder(
  orderId: string,
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  let previousStatus: OrderStatus | undefined;
  let hadStockProcessed = false;
  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    previousStatus = order.statut;
    hadStockProcessed = !!order.stockProcessed;
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

  void logAudit({
    action: "modification",
    entity: "order",
    entityId: orderId,
    userId: actor?.userId,
    metadata: {
      previousStatus,
      newStatus: "Annulée",
      hadStockProcessed,
    },
  }).catch((err) => console.warn("Audit annulation commande échouée:", err));
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

  void logAudit({
    action: "suppression",
    entity: "order",
    entityId: orderId,
    userId: actor?.userId,
  }).catch((err) => console.warn("Audit suppression commande échouée:", err));
}

export async function adminUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actor?: { userId?: string; isAdmin?: boolean }
) {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  let previousStatus: OrderStatus | undefined;
  let stockProcessed = false;

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable.");
    }
    const order = orderSnap.data() as Order;
    previousStatus = order.statut;
    if (!actor?.isAdmin && actor?.userId && order.utilisateur !== actor.userId) {
      throw new Error("Commande non autorisée.");
    }
    const shouldProcessStock =
      order.statut === "En attente" &&
      ["En préparation", "Expédiée", "Terminée"].includes(newStatus) &&
      !order.stockProcessed;
    stockProcessed = shouldProcessStock;

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

  void logAudit({
    action: "modification",
    entity: "order",
    entityId: orderId,
    userId: actor?.userId,
    metadata: {
      previousStatus,
      newStatus,
      stockProcessed,
    },
  }).catch((err) => console.warn("Audit statut commande échouée:", err));
}
