import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRole } from "../hooks/useRole";
import { logout } from "../services/authService";
import { listenUserData, updateUser } from "../services/roleService";
import { ROLE_LABELS } from "../types/roles";
import type { UserData } from "../types/roles";
import "../navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Profil");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", age: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  if (!user) return null;

  useEffect(() => {
    const unsubscribe = listenUserData(
      user.uid,
      (data) => {
        if (!data) return;
        setUserData(data);
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          age: data.age !== null && data.age !== undefined ? String(data.age) : "",
        });
        const fullName = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
        if (fullName) {
          setDisplayName(fullName);
        } else if (user.email) {
          setDisplayName(user.email.split("@")[0]);
        }
      },
      () => {
        if (user.email) {
          setDisplayName(user.email.split("@")[0]);
        }
      }
    );

    return () => unsubscribe();
  }, [user.uid, user.email]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userData) return;
    setSaving(true);
    setMessage(null);
    try {
      const parsedAge = form.age.trim() === "" ? null : Number(form.age);
      await updateUser(userData.uid, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: Number.isFinite(parsedAge) ? parsedAge : null,
      });
      setMessage("Profil mis à jour.");
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">GESTOCK</Link>
        </div>
        <div className="navbar-links">
          <Link className="navbar-link" to="/dashboard">
            Dashboard
          </Link>
          {isAdmin && (
            <Link className="navbar-link" to="/users">
              Utilisateurs
            </Link>
          )}
        </div>
        <div className="navbar-user">
          <div className="navbar-profile" ref={menuRef}>
            <button
              className="navbar-profile-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="navbar-profile-icon" aria-hidden="true">👤</span>
              <span className="navbar-profile-name">{displayName}</span>
            </button>
            {menuOpen && (
              <div className="navbar-menu" role="menu">
                <div className="navbar-menu-header">Mon profil</div>
                <div className="navbar-menu-body">
                  <div className="navbar-profile-row">
                    <span>Email</span>
                    <span>{userData?.email ?? "-"}</span>
                  </div>
                  <div className="navbar-profile-row">
                    <span>Rôle</span>
                    <span>{userData ? ROLE_LABELS[userData.role] : "-"}</span>
                  </div>
                  <form className="navbar-profile-form" onSubmit={handleSaveProfile}>
                    <label className="navbar-profile-field">
                      <span>Prénom</span>
                      <input
                        className="input input-compact"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        required
                        disabled={userData?.active === false}
                      />
                    </label>
                    <label className="navbar-profile-field">
                      <span>Nom</span>
                      <input
                        className="input input-compact"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        required
                        disabled={userData?.active === false}
                      />
                    </label>
                    <label className="navbar-profile-field">
                      <span>Âge</span>
                      <input
                        className="input input-compact"
                        type="number"
                        min={0}
                        max={120}
                        value={form.age}
                        onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
                        disabled={userData?.active === false}
                      />
                    </label>
                    <div className="navbar-profile-actions">
                      <button
                        className="button button-primary button-small"
                        type="submit"
                        disabled={saving || userData?.active === false}
                      >
                        {saving ? "..." : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                  {message && <p className="navbar-profile-message">{message}</p>}
                  {userData?.active === false && (
                    <p className="navbar-profile-message">Compte désactivé.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
