import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";
import { logout } from "../../services/authService";
import { listenUserData } from "../../services/roleService";
import "../../navbar.css";

export default function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("Profil");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenUserData(
      user.uid,
      (data) => {
        if (!data) return;
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
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

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
          <Link className="navbar-link" to="/products">
            Produits
          </Link>
          <Link className="navbar-link" to="/orders">
            Commandes
          </Link>
          <Link className="navbar-link" to="/stock">
            Stock
          </Link>
          {isAdmin && (
            <>
              <Link className="navbar-link" to="/admin">
                Admin
              </Link>
              <Link className="navbar-link" to="/admin/users">
                Utilisateurs
              </Link>
            </>
          )}
        </div>
        <div className="navbar-user">
          <div className="navbar-profile">
            <Link className="navbar-profile-button" to="/profile">
              <span className="navbar-profile-icon" aria-hidden="true">👤</span>
              <span className="navbar-profile-name">{displayName}</span>
            </Link>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
