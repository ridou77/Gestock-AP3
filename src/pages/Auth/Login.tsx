import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../../services/authService";
import { getPasswordError, PASSWORD_HINT } from "../../utils/password";
import "../../auth.css";

type Props = {
  defaultMode?: "login" | "register";
};

export default function Login({ defaultMode = "login" }: Props) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(defaultMode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const getErrorMessage = (err: unknown, fallback: string) => {
    const code = typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
    if (
      code === "auth/invalid-credential" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password"
    ) {
      return "Identifiant ou mot de passe invalide";
    }
    return err instanceof Error ? err.message : fallback;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        const passwordError = getPasswordError(password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }
        const parsedAge = age.trim() === "" ? null : Number(age);
        await register(email, password, "visiteur", {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          age: Number.isFinite(parsedAge) ? parsedAge : null,
        });
      } else {
        await login(email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-kicker">Gestion de stock</p>
          <h1>GESTOCK</h1>
          <p className="auth-subtitle">
            {isRegister ? "Créez un compte pour accéder à l'application." : "Accédez au tableau de bord sécurisé."}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input
              className="auth-input"
              type="email"
              placeholder="nom@domaine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <label className="auth-field">
            <span>Mot de passe</span>
            <input
              className="auth-input"
              type="password"
              placeholder="Minimum 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
          </label>
          {isRegister && <p className="helper-text">{PASSWORD_HINT}</p>}
          {isRegister && (
            <label className="auth-field">
              <span>Prénom</span>
              <input
                className="auth-input"
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
              />
            </label>
          )}
          {isRegister && (
            <label className="auth-field">
              <span>Nom</span>
              <input
                className="auth-input"
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
            </label>
          )}
          {isRegister && (
            <label className="auth-field">
              <span>Âge</span>
              <input
                className="auth-input"
                type="number"
                min={0}
                max={120}
                placeholder="Âge"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                disabled={loading}
              />
            </label>
          )}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Chargement..." : isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        {!isRegister && (
          <div style={{ marginTop: "12px", fontSize: "13px" }}>
            <Link to="/reset">Mot de passe oublié ?</Link>
          </div>
        )}

        {error && <div className="auth-message auth-error">{error}</div>}
      </div>
    </div>
  );
}
