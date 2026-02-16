import { vi } from "vitest";
import {
  adminUpdateOrderStatus,
  cancelOrder,
  updateOrderDetails,
} from "./orderService";
import * as firestore from "firebase/firestore";

vi.mock("./firebase", () => ({ db: {} }));

vi.mock("firebase/firestore", () => {
  const store = new Map<string, any>();
  const updates: Array<{ ref: any; data: any }> = [];
  const sets: Array<{ ref: any; data: any }> = [];
  const deletes: Array<any> = [];
  let autoId = 0;

  const __reset = () => {
    store.clear();
    updates.length = 0;
    sets.length = 0;
    deletes.length = 0;
    autoId = 0;
  };

  const __setDoc = (path: string, data: any) => {
    store.set(path, data);
  };

  const __getUpdates = () => updates.slice();
  const __getSets = () => sets.slice();
  const __getDeletes = () => deletes.slice();

  const collection = (_db: any, path: string) => ({ __type: "collection", path });

  const doc = (arg1: any, arg2?: string, arg3?: string) => {
    if (arg1 && arg1.__type === "collection" && !arg2) {
      const id = `auto_${++autoId}`;
      return { path: `${arg1.path}/${id}`, id };
    }
    if (arg1 && arg1.__type === "collection" && typeof arg2 === "string") {
      return { path: `${arg1.path}/${arg2}`, id: arg2 };
    }
    if (typeof arg1 === "object" && typeof arg2 === "string" && typeof arg3 === "string") {
      return { path: `${arg2}/${arg3}`, id: arg3 };
    }
    return { path: "unknown", id: "unknown" };
  };

  const runTransaction = async (_db: any, fn: (tx: any) => Promise<any>) => {
    const tx = {
      get: async (ref: any) => {
        const data = store.get(ref.path);
        return {
          exists: () => data !== undefined,
          data: () => data,
        };
      },
      update: vi.fn((ref: any, data: any) => {
        updates.push({ ref, data });
        const prev = store.get(ref.path) ?? {};
        store.set(ref.path, { ...prev, ...data });
      }),
      set: vi.fn((ref: any, data: any) => {
        sets.push({ ref, data });
        store.set(ref.path, data);
      }),
      delete: vi.fn((ref: any) => {
        deletes.push(ref);
        store.delete(ref.path);
      }),
    };
    return fn(tx);
  };

  const serverTimestamp = () => ({ __type: "serverTimestamp" });

  const onSnapshot = vi.fn();
  const orderBy = vi.fn();
  const query = vi.fn();
  const where = vi.fn();

  return {
    collection,
    doc,
    runTransaction,
    serverTimestamp,
    onSnapshot,
    orderBy,
    query,
    where,
    __reset,
    __setDoc,
    __getUpdates,
    __getSets,
    __getDeletes,
  };
});

const fsMock = firestore as any;

describe("orderService", () => {
  beforeEach(() => {
    fsMock.__reset();
  });

  it("refuse la modification si la commande n'est pas en attente", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "Terminée",
      utilisateur: "u1",
      details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
    });

    await expect(
      updateOrderDetails(
        "o1",
        [{ productId: "p1", nom: "Clavier", quantite: 1 }],
        { userId: "u1" }
      )
    ).rejects.toThrow("Commande non modifiable.");
  });

  it("refuse la mise à jour du statut si l'acteur n'est pas propriétaire", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "En attente",
      utilisateur: "u1",
      stockProcessed: false,
      details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
    });

    await expect(
      adminUpdateOrderStatus("o1", "En préparation", { userId: "u2", isAdmin: false })
    ).rejects.toThrow("Commande non autorisée.");
  });

  it("recrédite le stock lors d'une annulation si le stock a été traité", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "En préparation",
      utilisateur: "u1",
      stockProcessed: true,
      details: [{ productId: "p1", nom: "Clavier", quantite: 2 }],
    });
    fsMock.__setDoc("produits/p1", { quantite_dispo: 5 });

    await cancelOrder("o1", { userId: "u1", isAdmin: false });

    const updates = fsMock.__getUpdates();
    const productUpdate = updates.find((u: any) => u.ref.path === "produits/p1");
    expect(productUpdate).toBeTruthy();
    expect(productUpdate.data.quantite_dispo).toBe(7);

    const sets = fsMock.__getSets();
    expect(sets.some((s: any) => s.ref.path.startsWith("mouvements/"))).toBe(true);
  });
});
