import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "En attente"
  | "En préparation"
  | "Expédiée"
  | "Terminée"
  | "Annulée";

export type OrderDetail = {
  productId: string;
  nom: string;
  quantite: number;
};

export type Order = {
  id: string;
  utilisateur: string;
  utilisateurEmail: string;
  dateCommande?: Timestamp;
  statut: OrderStatus;
  details: OrderDetail[];
  stockProcessed?: boolean;
};
