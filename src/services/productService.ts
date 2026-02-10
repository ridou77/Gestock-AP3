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
  await addDoc(typesRef, {
    nom,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
}

export async function updateStockType(id: string, nom: string) {
  const typeRef = doc(db, TYPES_COLLECTION, id);
  await updateDoc(typeRef, { nom });
}

export async function deleteStockType(id: string) {
  const typeRef = doc(db, TYPES_COLLECTION, id);
  await deleteDoc(typeRef);
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
  await addDoc(productsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(productRef, payload);
}

export async function deleteProduct(id: string) {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(productRef);
}
