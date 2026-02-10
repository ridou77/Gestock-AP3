import type { Timestamp } from "firebase/firestore";

export type StockType = {
  id: string;
  nom: string;
  createdAt?: Timestamp;
  createdBy?: string;
};

export type Product = {
  id: string;
  nom: string;
  description: string;
  typeStockId: string;
  quantite_dispo: number;
  seuil_alerte: number;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
