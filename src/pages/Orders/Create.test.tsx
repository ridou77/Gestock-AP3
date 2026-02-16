import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import OrderCreate from "./Create";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import { listenProducts } from "../../services/productService";
import { createOrder } from "../../services/orderService";

vi.mock("../../hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../../hooks/useRole", () => ({ useRole: vi.fn() }));
vi.mock("../../services/productService", () => ({ listenProducts: vi.fn() }));
vi.mock("../../services/orderService", () => ({ createOrder: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseRole = vi.mocked(useRole);
const mockedListenProducts = vi.mocked(listenProducts);

describe("OrderCreate", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: { uid: "u1", email: "user@test.local" },
    } as any);
    mockedListenProducts.mockImplementation((onData) => {
      onData([
        {
          id: "p1",
          nom: "Clavier",
          description: "Clavier mecanique",
          typeStockId: "t1",
          createdBy: "u1",
          quantite_dispo: 2,
          seuil_alerte: 3,
        },
      ]);
      return () => {};
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le message lecture seule pour le visiteur", () => {
    mockedUseRole.mockReturnValue({
      permissions: { canCreate: false },
    } as any);

    render(
      <MemoryRouter>
        <OrderCreate />
      </MemoryRouter>
    );
    expect(
      screen.getByText("Votre rôle est en lecture seule. La création de commande est désactivée.")
    ).toBeInTheDocument();
    expect(screen.getByText("Voir mes commandes")).toBeInTheDocument();
  });

  it("affiche une erreur si le panier est vide", async () => {
    mockedUseRole.mockReturnValue({
      permissions: { canCreate: true },
    } as any);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OrderCreate />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: "Valider la commande" }));

    expect(screen.getByText("Ajoute au moins un produit.")).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });
});
