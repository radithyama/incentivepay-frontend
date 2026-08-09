import { useState, type FormEvent } from "react";
import { ledgerApi, ApiError } from "../api";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { ErrorAlert, EmptyState } from "../ui/Alert";
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ip-text">Participant ledger</h1>
        <p className="mt-1 text-sm text-ip-text-muted">
          How much has this person been paid, and for what - the reconciliation view.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="flex items-end gap-3">
          <div className="flex-1">
            <Field label="Participant external ref">
              <Input value={participantRef} onChange={(e) => setParticipantRef(e.target.value)} placeholder="EMP-1" />
            </Field>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Look up"}
          </Button>
        </form>
      </Card>

      {error && <ErrorAlert message={error} />}

      {ledger && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-ip-text">
            {ledger.participantExternalRef} <span className="text-ip-text-muted">- total paid: {ledger.totalPaid}</span>
          </h2>
          {ledger.entries.length === 0 ? (
            <EmptyState message="No disbursements recorded yet." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ip-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ip-border text-left text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                    <th className="px-3 py-2">Disbursement</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Disbursed at</th>
                    <th className="px-3 py-2">Confirmation</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-ip-border last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{entry.disbursementId}</td>
                      <td className="px-3 py-2 font-medium text-ip-text">
                        {entry.amount} {entry.currency}
                      </td>
                      <td className="px-3 py-2 text-ip-text-muted">{new Date(entry.disbursedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-ip-text-muted">{entry.paymentRailConfirmationId ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
