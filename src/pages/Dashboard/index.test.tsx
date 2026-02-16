import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "./index";
import type { Product } from "../../types/products";
import type { Order } from "../../types/orders";

const products: Product[] = [
  {
    id: "p1",
    nom: "Clavier",
    description: "Clavier mecanique",
    typeStockId: "t1",
    createdBy: "u1",
    quantite_dispo: 2,
    seuil_alerte: 3,
  },
  {
    id: "p2",
    nom: "Souris",
    description: "Souris optique",
    typeStockId: "t1",
    createdBy: "u1",
    quantite_dispo: 10,
    seuil_alerte: 3,
  },
];

const orders: Order[] = [
  {
    id: "o1",
    utilisateur: "u1",
    utilisateurEmail: "user@test.local",
    statut: "En attente",
    details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
  },
];

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "user@test.local" },
    profile: { firstName: "Jean", lastName: "Test", active: true },
  }),
}));

vi.mock("../../hooks/useRole", () => ({
  useRole: () => ({ role: "gestionnaire" }),
}));

vi.mock("../../services/productService", () => ({
  listenProducts: (onData: (data: Product[]) => void) => {
    onData(products);
    return () => {};
  },
}));

vi.mock("../../services/orderService", () => ({
  listenUserOrders: (_userId: string, onData: (data: Order[]) => void) => {
    onData(orders);
    return () => {};
  },
}));

describe("Dashboard", () => {
  it("affiche les alertes de seuil et les commandes en attente", () => {
    render(<Dashboard />);

    const alertLabel = screen.getByText("Alertes sous seuil");
    const alertBlock = alertLabel.closest("div");
    expect(alertBlock).not.toBeNull();
    if (alertBlock) {
      expect(within(alertBlock).getByText("1")).toBeInTheDocument();
    }
    expect(screen.getByText("Commandes en attente")).toBeInTheDocument();
  });
});
