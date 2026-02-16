import { useState, type FormEvent } from "react";
import { resetPassword } from "../../services/authService";
import "../../auth.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await resetPassword(email);
      setMessage("Email de réinitialisation envoyé.");
    } catch (err) {
      setError(getErrorMessage(err, "Impossible d'envoyer l'email."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-kicker">Gestion de stock</p>
          <h1>Mot de passe</h1>
          <p className="auth-subtitle">Renseigne ton email pour recevoir un lien.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer"}
          </button>
        </form>

        {message && <div className="auth-message">{message}</div>}
        {error && <div className="auth-message auth-error">{error}</div>}
      </div>
    </div>
  );
}
