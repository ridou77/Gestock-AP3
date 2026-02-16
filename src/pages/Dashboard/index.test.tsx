import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import Dashboard from "./index";

const products = [
  { id: "p1", nom: "Clavier", quantite_dispo: 2, seuil_alerte: 3 },
  { id: "p2", nom: "Souris", quantite_dispo: 10, seuil_alerte: 3 },
];

const orders = [
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
  listenProducts: (onData: (data: any[]) => void) => {
    onData(products);
    return () => {};
  },
}));

vi.mock("../../services/orderService", () => ({
  listenUserOrders: (_userId: string, onData: (data: any[]) => void) => {
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
