import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { logAudit } from "./auditService";
import type { Product, StockType } from "../types/products";

const TYPES_COLLECTION = "typeStock";
const PRODUCTS_COLLECTION = "produits";

export function listenStockTypes(
  onTypes: (types: StockType[]) => void,
  onError?: (error: Error) => void
) {
  const typesRef = collection(db, TYPES_COLLECTION);
  const q = query(typesRef, orderBy("nom"));
  return onSnapshot(
    q,
    (snapshot) => {
      const types = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nom: data.nom,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
        } as StockType;
      });
      onTypes(types);
    },
    (error) => onError?.(error)
  );
}

export async function createStockType(nom: string, userId: string) {
  const typesRef = collection(db, TYPES_COLLECTION);
  const docRef = await addDoc(typesRef, {
    nom,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  void logAudit({
    action: "creation",
    entity: "stock",
    entityId: docRef.id,
    userId,
    metadata: { nom },
  }).catch((err) => console.warn("Audit creation type échoué:", err));
}

export async function updateStockType(id: string, nom: string) {
  const typeRef = doc(db, TYPES_COLLECTION, id);
  await updateDoc(typeRef, { nom });
  void logAudit({
    action: "modification",
    entity: "stock",
    entityId: id,
    metadata: { nom },
  }).catch((err) => console.warn("Audit update type échoué:", err));
}

export async function deleteStockType(id: string) {
  const typeRef = doc(db, TYPES_COLLECTION, id);
  await deleteDoc(typeRef);
  void logAudit({
    action: "suppression",
    entity: "stock",
    entityId: id,
  }).catch((err) => console.warn("Audit delete type échoué:", err));
}

export function listenProducts(
  onProducts: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(productsRef, orderBy("nom"));
  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nom: data.nom,
          description: data.description,
          typeStockId: data.typeStockId,
          quantite_dispo: data.quantite_dispo ?? 0,
          seuil_alerte: data.seuil_alerte ?? 0,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Product;
      });
      onProducts(products);
    },
    (error) => onError?.(error)
  );
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  const docRef = await addDoc(productsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  void logAudit({
    action: "creation",
    entity: "product",
    entityId: docRef.id,
    userId: data.createdBy,
    metadata: {
      nom: data.nom,
      typeStockId: data.typeStockId,
      quantite_dispo: data.quantite_dispo,
      seuil_alerte: data.seuil_alerte,
    },
  }).catch((err) => console.warn("Audit creation produit échoué:", err));
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(productRef, payload);
  void logAudit({
    action: "modification",
    entity: "product",
    entityId: id,
    metadata: {
      updatedFields: Object.keys(data),
    },
  }).catch((err) => console.warn("Audit update produit échoué:", err));
}

export async function deleteProduct(id: string) {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(productRef);
  void logAudit({
    action: "suppression",
    entity: "product",
    entityId: id,
  }).catch((err) => console.warn("Audit delete produit échoué:", err));
}
