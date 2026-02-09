import { useState, useEffect } from "react";
import { listenAllUsers, updateUser } from "../services/roleService";
import { useRole } from "../hooks/useRole";
import { useAuth } from "../hooks/useAuth";
import type { UserData, UserRole } from "../types/roles";

type UserDraft = {
    firstName: string;
    lastName: string;
    age: string;
    role: UserRole;
};

export default function UserManagement() {
    const { isAdmin, loading: roleLoading } = useRole();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!isAdmin) return;
        setLoading(true);
        setError(null);

        const unsubscribe = listenAllUsers(
            (allUsers) => {
                setUsers(allUsers);
                setLoading(false);
            },
            (err) => {
                console.error("Erreur:", err);
                setError("Impossible de charger les utilisateurs. Vérifie les droits ou la connexion.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [isAdmin]);

    function buildDraft(user: UserData): UserDraft {
        return {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            age: user.age !== null && user.age !== undefined ? String(user.age) : "",
            role: user.role,
        };
    }

    function getDraft(user: UserData): UserDraft {
        return drafts[user.uid] ?? buildDraft(user);
    }

    function updateDraft(user: UserData, patch: Partial<UserDraft>) {
        setDrafts((prev) => {
            const current = prev[user.uid] ?? buildDraft(user);
            return { ...prev, [user.uid]: { ...current, ...patch } };
        });
    }

    async function saveUser(user: UserData) {
        const draft = drafts[user.uid];
        if (!draft) return;

        setActionError(null);
        setSaving((prev) => ({ ...prev, [user.uid]: true }));
        try {
            const parsedAge = draft.age.trim() === "" ? null : Number(draft.age);
            await updateUser(user.uid, {
                firstName: draft.firstName.trim(),
                lastName: draft.lastName.trim(),
                age: Number.isFinite(parsedAge) ? parsedAge : null,
                role: user.uid === currentUser?.uid ? user.role : draft.role,
            });
            setDrafts((prev) => {
                const { [user.uid]: _, ...rest } = prev;
                return rest;
            });
        } catch (err) {
            console.error("Erreur:", err);
            setActionError("Impossible de sauvegarder l'utilisateur.");
        } finally {
            setSaving((prev) => ({ ...prev, [user.uid]: false }));
        }
    }

    async function removeUser(user: UserData) {
        if (user.uid === currentUser?.uid) return;
        setActionError(null);
        setDeleting((prev) => ({ ...prev, [user.uid]: true }));
        try {
            await updateUser(user.uid, { active: false });
        } catch (err) {
            console.error("Erreur:", err);
            setActionError("Suppression impossible. Vérifie les droits.");
        } finally {
            setDeleting((prev) => ({ ...prev, [user.uid]: false }));
        }
    }

    async function reactivateUser(user: UserData) {
        if (user.uid === currentUser?.uid) return;
        setActionError(null);
        setDeleting((prev) => ({ ...prev, [user.uid]: true }));
        try {
            await updateUser(user.uid, { active: true });
        } catch (err) {
            console.error("Erreur:", err);
            setActionError("Réactivation impossible. Vérifie les droits.");
        } finally {
            setDeleting((prev) => ({ ...prev, [user.uid]: false }));
        }
    }

    if (roleLoading) {
        return <div className="page-container">Chargement des droits...</div>;
    }
    if (!isAdmin) return <div className="page-container">Accès refusé</div>;

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <p className="page-kicker">Administration</p>
                    <h1>Gestion des utilisateurs</h1>
                </div>
                <div className="badge">Synchronisé</div>
            </div>

            {loading ? (
                <p className="helper-text">Chargement...</p>
            ) : error ? (
                <div className="card">{error}</div>
            ) : (
                <div className="card card-table">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Prénom</th>
                                <th>Nom</th>
                                <th>Âge</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="table-empty">
                                        Aucun utilisateur
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const draft = getDraft(user);
                                    const isSelf = user.uid === currentUser?.uid;

                                    return (
                                        <tr key={user.uid}>
                                            <td>
                                                <input
                                                    className="input input-compact"
                                                    value={draft.firstName}
                                                    onChange={(e) => updateDraft(user, { firstName: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="input input-compact"
                                                    value={draft.lastName}
                                                    onChange={(e) => updateDraft(user, { lastName: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className="input input-compact"
                                                    type="number"
                                                    min={0}
                                                    max={120}
                                                    value={draft.age}
                                                    onChange={(e) => updateDraft(user, { age: e.target.value })}
                                                />
                                            </td>
                                            <td>
                                                {user.email}
                                                {isSelf && <span className="badge badge-soft">VOUS</span>}
                                            </td>
                                            <td>
                                                <select
                                                    className="input-select"
                                                    value={draft.role}
                                                    onChange={(e) => updateDraft(user, { role: e.target.value as UserRole })}
                                                    disabled={isSelf}
                                                >
                                                    <option value="visiteur">Visiteur</option>
                                                    <option value="gestionnaire">Gestionnaire</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.active ? "" : "badge-muted"}`}>
                                                    {user.active ? "Actif" : "Désactivé"}
                                                </span>
                                            </td>
                                            <td className="table-actions">
                                                <button
                                                    className="button button-primary button-small"
                                                    onClick={() => saveUser(user)}
                                                    disabled={saving[user.uid]}
                                                >
                                                    {saving[user.uid] ? "..." : "Enregistrer"}
                                                </button>
                                                {user.active ? (
                                                    <button
                                                        className="button button-danger button-small"
                                                        onClick={() => removeUser(user)}
                                                        disabled={isSelf || deleting[user.uid]}
                                                    >
                                                        {deleting[user.uid] ? "..." : "Désactiver"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="button button-primary button-small"
                                                        onClick={() => reactivateUser(user)}
                                                        disabled={isSelf || deleting[user.uid]}
                                                    >
                                                        {deleting[user.uid] ? "..." : "Réactiver"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {actionError && <p className="helper-text">{actionError}</p>}
        </div>
    );
}
