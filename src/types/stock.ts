import type { Timestamp } from "firebase/firestore";

export type StockMovementType = "Entrée" | "Sortie";

export type StockMovement = {
  id: string;
  type_mouvement: StockMovementType;
  produitId: string;
  produitNom: string;
  quantite: number;
  utilisateur: string;
  date?: Timestamp;
  orderId?: string;
};
