import { useEffect, useState } from "react";
import { listenAudit } from "../../services/auditService";
import type { AuditEntry } from "../../types/audit";

export default function AdminAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]); // stocker la lsite des logs d'audit reçu de firestore
  const [error, setError] = useState<string | null>(null); // envoyer msg erreur

  const formatDate = (value?: { toDate?: () => Date }) => { // créer un objet date et formater en version fr si une valeur existe
    if (!value || typeof value.toDate !== "function") return "—"; // "—" date indispo
    const date = value.toDate();
    return date.toLocaleString("fr-FR");
  };

  useEffect(() => { // hook pour charger les audits, met à jour l'état entries avec les nouveaux logs
    const unsubscribe = listenAudit(
      setEntries,
      () => setError("Impossible de charger les audits.") // else msg erreur
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="page-kicker">Administration</p>
          <h1>Historique des actions</h1>
        </div>
      </div>

      {error && <p className="helper-text">{error}</p>}

      <div className="card card-table">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Ressource</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  Aucun audit 
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.timestamp)}</td>
                  <td>{entry.userEmail ?? entry.userId ?? "—"}</td>
                  <td>{entry.action}</td>
                  <td>
                    {entry.entity}
                    {entry.entityId ? ` (${entry.entityId.slice(0, 6)}...)` : ""}
                  </td>
                  <td>
                    {entry.metadata ? (
                      <code>{JSON.stringify(entry.metadata)}</code>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
