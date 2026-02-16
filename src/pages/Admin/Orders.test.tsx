import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import AdminOrders from "./Orders";
import { listenAllOrders } from "../../services/orderService";

vi.mock("../../services/orderService", () => ({
  listenAllOrders: vi.fn(),
  adminUpdateOrderStatus: vi.fn(),
  deleteOrder: vi.fn(),
}));

const mockedListenAllOrders = vi.mocked(listenAllOrders);

describe("AdminOrders", () => {
  beforeEach(() => {
    mockedListenAllOrders.mockImplementation((onData) => {
      onData([
        {
          id: "o1",
          utilisateur: "u1",
          utilisateurEmail: "user@test.local",
          dateCommande: undefined,
          statut: "En attente",
          details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
          stockProcessed: false,
        },
        {
          id: "o2",
          utilisateur: "u2",
          utilisateurEmail: "user2@test.local",
          dateCommande: undefined,
          statut: "En préparation",
          details: [{ productId: "p2", nom: "Souris", quantite: 2 }],
          stockProcessed: true,
        },
      ]);
      return () => {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche un select de statut pour chaque commande", () => {
    render(<AdminOrders />);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("n'affiche supprimer que pour les commandes supprimables", () => {
    render(<AdminOrders />);
    expect(screen.getAllByText("Supprimer")).toHaveLength(1);
  });
});
