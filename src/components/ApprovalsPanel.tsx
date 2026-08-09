import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { hasRole } from "../keycloak";
import type { Disbursement } from "../types";

export function ApprovalsPanel() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const canApprove = hasRole("approver");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDisbursements(await api.get<Disbursement[]>("/v1/disbursements?status=PENDING_APPROVAL"));
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/v1/disbursements/${id}/approve`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = rejectReason[id];
    if (!reason || !reason.trim()) {
      setError("A rejection reason is required");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await api.post(`/v1/disbursements/${id}/reject`, { reason });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="panel">
      <h2>Approvals queue</h2>
      <p className="hint">
        Disbursements above the auto-approve threshold land here. Try this as a <code>viewer</code> token to see
        the RBAC story: the buttons stay visible, but the server returns 403.
      </p>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : disbursements.length === 0 ? (
        <p>Nothing pending.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Amount</th>
              <th>Created</th>
              <th>Reject reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {disbursements.map((d) => (
              <tr key={d.id}>
                <td>{d.participantExternalRef}</td>
                <td>{d.computedAmount}</td>
                <td>{new Date(d.createdAt).toLocaleString()}</td>
                <td>
                  <input
                    placeholder="reason"
                    value={rejectReason[d.id] ?? ""}
                    onChange={(e) => setRejectReason({ ...rejectReason, [d.id]: e.target.value })}
                  />
                </td>
                <td>
                  <button disabled={!canApprove || busyId === d.id} onClick={() => approve(d.id)}>
                    Approve
                  </button>
                  <button disabled={!canApprove || busyId === d.id} onClick={() => reject(d.id)}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
