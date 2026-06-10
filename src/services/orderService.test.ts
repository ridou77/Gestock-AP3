import { vi } from "vitest";
import {
  adminUpdateOrderStatus,
  cancelOrder,
  deleteOrder,
  updateOrderDetails,
} from "./orderService";
import * as firestore from "firebase/firestore";

vi.mock("./firebase", () => ({ db: {}, auth: { currentUser: null } }));

vi.mock("firebase/firestore", () => {
  type DocRef = { path: string; id: string; __type?: "collection" };
  type StoredDoc = Record<string, unknown>;
  type UpdateEntry = { ref: DocRef; data: StoredDoc };
  type SetEntry = { ref: DocRef; data: StoredDoc };

  const store = new Map<string, StoredDoc>();
  const updates: UpdateEntry[] = [];
  const sets: SetEntry[] = [];
  const deletes: DocRef[] = [];
  let autoId = 0;

  const __reset = () => {
    store.clear();
    updates.length = 0;
    sets.length = 0;
    deletes.length = 0;
    autoId = 0;
  };

  const __setDoc = (path: string, data: StoredDoc) => {
    store.set(path, data);
  };

  const __getUpdates = () => updates.slice();
  const __getSets = () => sets.slice();
  const __getDeletes = () => deletes.slice();

  const collection = (_db: unknown, path: string): DocRef => ({
    __type: "collection",
    path,
    id: path,
  });

  const doc = (arg1: unknown, arg2?: string, arg3?: string): DocRef => {
    if (typeof arg1 === "object" && arg1 !== null && (arg1 as DocRef).__type === "collection" && !arg2) {
      const col = arg1 as DocRef;
      const id = `auto_${++autoId}`;
      return { path: `${col.path}/${id}`, id };
    }
    if (typeof arg1 === "object" && arg1 !== null && (arg1 as DocRef).__type === "collection" && typeof arg2 === "string") {
      const col = arg1 as DocRef;
      return { path: `${col.path}/${arg2}`, id: arg2 };
    }
    if (typeof arg1 === "object" && typeof arg2 === "string" && typeof arg3 === "string") {
      return { path: `${arg2}/${arg3}`, id: arg3 };
    }
    return { path: "unknown", id: "unknown" };
  };

  const runTransaction = async (_db: unknown, fn: (tx: {
    get: (ref: DocRef) => Promise<{ exists: () => boolean; data: () => StoredDoc | undefined }>;
    update: (ref: DocRef, data: StoredDoc) => void;
    set: (ref: DocRef, data: StoredDoc) => void;
    delete: (ref: DocRef) => void;
  }) => Promise<unknown>) => {
    const tx = {
      get: async (ref: DocRef) => {
        const data = store.get(ref.path);
        return {
          exists: () => data !== undefined,
          data: () => data,
        };
      },
      update: vi.fn((ref: DocRef, data: StoredDoc) => {
        updates.push({ ref, data });
        const prev = store.get(ref.path) ?? {};
        store.set(ref.path, { ...prev, ...data });
      }),
      set: vi.fn((ref: DocRef, data: StoredDoc) => {
        sets.push({ ref, data });
        store.set(ref.path, data);
      }),
      delete: vi.fn((ref: DocRef) => {
        deletes.push(ref);
        store.delete(ref.path);
      }),
    };
    return fn(tx);
  };

  const serverTimestamp = () => ({ __type: "serverTimestamp" });
  const addDoc = async (ref: DocRef, data: StoredDoc) => {
    const newRef = doc(ref);
    sets.push({ ref: newRef, data });
    store.set(newRef.path, data);
    return newRef;
  };

  const onSnapshot = vi.fn();
  const orderBy = vi.fn();
  const query = vi.fn();
  const where = vi.fn();

  return {
    collection,
    doc,
    runTransaction,
    serverTimestamp,
    addDoc,
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

type FirestoreTestHelpers = {
  __reset: () => void;
  __setDoc: (path: string, data: Record<string, unknown>) => void;
  __getUpdates: () => Array<{ ref: { path: string }; data: Record<string, unknown> }>;
  __getSets: () => Array<{ ref: { path: string }; data: Record<string, unknown> }>;
  __getDeletes: () => Array<{ path: string }>;
};

const fsMock = firestore as unknown as FirestoreTestHelpers;

describe("orderService", () => {
  beforeEach(() => {
    fsMock.__reset();
  });

  it("autorise la modification même si la commande n'est pas en attente", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "Terminée",
      utilisateur: "u1",
      stockProcessed: false,
      details: [{ productId: "p1", nom: "Clavier", quantite: 1 }],
    });
    fsMock.__setDoc("produits/p1", { quantite_dispo: 5 });

    await updateOrderDetails(
      "o1",
      [{ productId: "p1", nom: "Clavier", quantite: 2 }],
      { userId: "u1" }
    );

    const updates = fsMock.__getUpdates();
    const orderUpdate = updates.find((u) => u.ref.path === "commandes/o1");
    expect(orderUpdate?.data.details).toEqual([
      { productId: "p1", nom: "Clavier", quantite: 2 },
    ]);
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
    const productUpdate = updates.find((u) => u.ref.path === "produits/p1");
    expect(productUpdate).toBeTruthy();
    expect(productUpdate?.data.quantite_dispo).toBe(7);

    const sets = fsMock.__getSets();
    expect(sets.some((s) => s.ref.path.startsWith("mouvements/"))).toBe(true);
  });

  it("recrédite le stock quand le statut passe à Annulée depuis la liste", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "En préparation",
      utilisateur: "u1",
      stockProcessed: true,
      details: [{ productId: "p1", nom: "Clavier", quantite: 2 }],
    });
    fsMock.__setDoc("produits/p1", { quantite_dispo: 5 });

    await adminUpdateOrderStatus("o1", "Annulée", { userId: "u1", isAdmin: false });

    const updates = fsMock.__getUpdates();
    const productUpdate = updates.find((u) => u.ref.path === "produits/p1");
    const orderUpdate = updates.find((u) => u.ref.path === "commandes/o1");
    expect(productUpdate?.data.quantite_dispo).toBe(7);
    expect(orderUpdate?.data.statut).toBe("Annulée");
    expect(orderUpdate?.data.stockProcessed).toBe(false);

    const sets = fsMock.__getSets();
    const movement = sets.find((s) => s.ref.path.startsWith("mouvements/"));
    expect(movement?.data.type_mouvement).toBe("Entrée");
  });

  it("recrédite le stock avant suppression si le stock a été traité", async () => {
    fsMock.__setDoc("commandes/o1", {
      statut: "Terminée",
      utilisateur: "u1",
      stockProcessed: true,
      details: [{ productId: "p1", nom: "Clavier", quantite: 2 }],
    });
    fsMock.__setDoc("produits/p1", { quantite_dispo: 5 });

    await deleteOrder("o1", { userId: "u1", isAdmin: false });

    const updates = fsMock.__getUpdates();
    const productUpdate = updates.find((u) => u.ref.path === "produits/p1");
    expect(productUpdate?.data.quantite_dispo).toBe(7);
    expect(fsMock.__getDeletes().some((ref) => ref.path === "commandes/o1")).toBe(true);
  });
});
