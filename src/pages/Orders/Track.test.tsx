import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import OrderTrack from "./Track";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import {
  adminUpdateOrderStatus,
  cancelOrder,
  listenUserOrders,
  updateOrderDetails,
} from "../../services/orderService";
import type { AuthContextType } from "../../contexts/authContext";
import type { Order } from "../../types/orders";
import type { User } from "firebase/auth";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useRole", () => ({ useRole: vi.fn() }));
vi.mock("../../services/orderService", () => ({
  listenUserOrders: vi.fn(),
  listenAllOrders: vi.fn(),
  updateOrderDetails: vi.fn(),
  cancelOrder: vi.fn(),
  adminUpdateOrderStatus: vi.fn(),
  deleteOrder: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseRole = vi.mocked(useRole);
const mockedListenUserOrders = vi.mocked(listenUserOrders);

describe("OrderTrack", () => {
  beforeEach(() => {
    const authValue: AuthContextType = {
      user: { uid: "u1", email: "user@test.local" } as User,
      profile: null,
      loading: false,
    };
    mockedUseAuth.mockReturnValue(authValue);
    mockedUseRole.mockReturnValue({
      isAdmin: false,
      isGestionnaire: true,
      permissions: { canUpdate: true },
    } as ReturnType<typeof useRole>);
    mockedListenUserOrders.mockImplementation((_userId, onData: (data: Order[]) => void) => {
      onData([
        {
          id: "o1",
          utilisateur: "u1",
          utilisateurEmail: "user@test.local",
          statut: "En attente",
          details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
        },
        {
          id: "o2",
          utilisateur: "u1",
          utilisateurEmail: "user@test.local",
          statut: "Terminée",
          details: [{ productId: "p2", nom: "Souris", quantite: 2 }],
        },
      ]);
      return () => {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("montre le select de statut pour le gestionnaire propriétaire", () => {
    render(<OrderTrack />);
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
  });

  it("n'affiche le bouton Modifier que si la commande est en attente", () => {
    render(<OrderTrack />);
    const editButtons = screen.getAllByText("Modifier");
    expect(editButtons).toHaveLength(1);
  });

  it("n'affiche le bouton Annuler que si la commande est annulable", () => {
    render(<OrderTrack />);
    const cancelButtons = screen.getAllByText("Annuler");
    expect(cancelButtons).toHaveLength(1);
    expect(updateOrderDetails).not.toHaveBeenCalled();
    expect(cancelOrder).not.toHaveBeenCalled();
    expect(adminUpdateOrderStatus).not.toHaveBeenCalled();
  });
});
