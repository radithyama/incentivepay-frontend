import { useState, type FormEvent } from "react";
import { ledgerApi, ApiError } from "../api";
import type { ParticipantLedger } from "../types";

export function LedgerPanel() {
  const [participantRef, setParticipantRef] = useState("");
  const [ledger, setLedger] = useState<ParticipantLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!participantRef.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setLedger(await ledgerApi.get<ParticipantLedger>(`/v1/ledger/${encodeURIComponent(participantRef)}`));
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Failed to load ledger");
      setLedger(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>Participant ledger</h2>
      <p className="hint">How much has this person been paid, and for what - the reconciliation view.</p>
      <form onSubmit={handleSearch} className="card">
        <label>
          Participant external ref
          <input value={participantRef} onChange={(e) => setParticipantRef(e.target.value)} placeholder="EMP-1" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Look up"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {ledger && (
        <div className="card">
          <h3>
            {ledger.participantExternalRef} - total paid: {ledger.totalPaid}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Disbursement</th>
                <th>Amount</th>
                <th>Disbursed at</th>
                <th>Confirmation</th>
              </tr>
            </thead>
            <tbody>
              {ledger.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.disbursementId}</td>
                  <td>
                    {entry.amount} {entry.currency}
                  </td>
                  <td>{new Date(entry.disbursedAt).toLocaleString()}</td>
                  <td>{entry.paymentRailConfirmationId ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
