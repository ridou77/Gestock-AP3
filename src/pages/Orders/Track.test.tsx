import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import OrderTrack from "./Track";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import {
  adminUpdateOrderStatus,
  deleteOrder,
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
const mockedDeleteOrder = vi.mocked(deleteOrder);

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

  it("affiche le bouton Modifier quel que soit le statut", () => {
    render(<OrderTrack />);
    const editButtons = screen.getAllByText("Modifier");
    expect(editButtons).toHaveLength(2);
  });

  it("n'affiche pas de bouton Annuler", () => {
    render(<OrderTrack />);
    expect(screen.queryByText("Annuler")).not.toBeInTheDocument();
    expect(updateOrderDetails).not.toHaveBeenCalled();
    expect(adminUpdateOrderStatus).not.toHaveBeenCalled();
  });

  it("demande une confirmation avant de supprimer une commande", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<OrderTrack />);
    await user.click(screen.getAllByText("Supprimer")[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Supprimer cette commande ? Cette action est définitive."
    );
    await waitFor(() => {
      expect(mockedDeleteOrder).toHaveBeenCalledWith("o1", {
        userId: "u1",
        isAdmin: false,
      });
    });
  });
});
