import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import { listenUserData, updateUser } from "../../services/roleService";
import { changePassword } from "../../services/authService";
import { ROLE_LABELS } from "../../types/roles";
import { getPasswordError, PASSWORD_HINT } from "../../utils/password";
import type { UserData } from "../../types/roles";

type ProfileForm = {
  firstName: string;
  lastName: string;
  age: string;
};

export default function Profile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    age: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenUserData(
      user.uid,
      (data) => {
        setUserData(data);
        if (data) {
          setForm({
            firstName: data.firstName ?? "",
            lastName: data.lastName ?? "",
            age: data.age !== null && data.age !== undefined ? String(data.age) : "",
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Erreur:", err);
        setError("Impossible de charger le profil.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const parsedAge = form.age.trim() === "" ? null : Number(form.age);
      await updateUser(user.uid, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: Number.isFinite(parsedAge) ? parsedAge : null,
      });
      setSuccess("Profil mis à jour.");
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.trim() === "" || confirmPassword.trim() === "") {
      setPasswordError("Renseigne et confirme le mot de passe.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    const validationError = getPasswordError(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(newPassword);
      setPasswordSuccess("Mot de passe mis à jour.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Impossible de modifier le mot de passe.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return <div className="page-container">Chargement du profil...</div>;
  }

  if (!userData) {
    return <div className="page-container">Profil introuvable.</div>;
  }

  const isInactive = userData.active === false;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Compte</p>
          <h1>Mon profil</h1>
        </div>
        <span className={`badge ${userData.active ? "" : "badge-muted"}`}>
          {userData.active ? "Actif" : "Désactivé"}
        </span>
      </div>

      <div className="card">
        <h2>Informations</h2>
        <div className="info-grid">
          <div>
            <p className="info-label">Email</p>
            <p className="info-value">{userData.email}</p>
          </div>
          <div>
            <p className="info-label">Rôle</p>
            <p className="info-value">{ROLE_LABELS[userData.role]}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Modifier mes informations</h2>
        <form className="form-grid" onSubmit={handleSave}>
          <input
            className="input"
            type="text"
            placeholder="Prénom"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
            disabled={isInactive}
          />
          <input
            className="input"
            type="text"
            placeholder="Nom"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
            disabled={isInactive}
          />
          <input
            className="input"
            type="number"
            min={0}
            max={120}
            placeholder="Âge"
            value={form.age}
            onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
            disabled={isInactive}
          />
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={saving || isInactive}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
        {error && <p className="helper-text">{error}</p>}
        {success && <p className="helper-text">{success}</p>}
        {isInactive && <p className="helper-text">Compte désactivé. Contacte un administrateur.</p>}
      </div>

      <div className="card">
        <h2>Modifier mon mot de passe</h2>
        <form className="form-grid" onSubmit={handlePasswordSave}>
          <input
            className="input"
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isInactive || passwordSaving}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isInactive || passwordSaving}
          />
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={passwordSaving || isInactive}>
              {passwordSaving ? "Enregistrement..." : "Mettre à jour"}
            </button>
          </div>
        </form>
        <p className="helper-text">{PASSWORD_HINT}</p>
        {passwordError && <p className="helper-text">{passwordError}</p>}
        {passwordSuccess && <p className="helper-text">{passwordSuccess}</p>}
      </div>
    </div>
  );
}
