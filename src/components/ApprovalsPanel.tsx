import { useEffect, useState } from "react";
import { api, friendlyErrorMessage } from "../api";
import { hasRole } from "../keycloak";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { ErrorAlert, EmptyState } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";
import type { Disbursement } from "../types";

export function ApprovalsPanel() {
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const toast = useToast();

  const canApprove = hasRole("approver");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDisbursements(await api.get<Disbursement[]>("/v1/disbursements?status=PENDING_APPROVAL"));
    } catch (e) {
      setError(friendlyErrorMessage(e, "Failed to load approvals."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await api.post(`/v1/disbursements/${id}/approve`);
      toast.success("Disbursement approved.");
      await load();
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "Couldn't approve this disbursement."));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = rejectReason[id];
    if (!reason || !reason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/v1/disbursements/${id}/reject`, { reason });
      toast.success("Disbursement rejected.");
      await load();
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "Couldn't reject this disbursement."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ip-text">Approvals queue</h1>
          <p className="mt-1 text-sm text-ip-text-muted">
            Disbursements above the auto-approve threshold land here. Try this as a{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">viewer</code> to see the RBAC story - the
            buttons stay visible, the server returns 403.
          </p>
        </div>
        {disbursements.length > 0 && <Badge tone="warning">{disbursements.length} pending</Badge>}
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <p className="text-sm text-ip-text-muted">Loading...</p>
      ) : disbursements.length === 0 ? (
        <EmptyState message="Nothing pending." />
      ) : (
        <>
          {/* Mobile: stacked cards - a 5-column table doesn't fit a phone screen usefully. */}
          <div className="flex flex-col gap-3 md:hidden">
            {disbursements.map((d) => (
              <div key={d.id} className="rounded-xl border border-ip-border bg-ip-surface p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-ip-text">{d.participantExternalRef}</span>
                  <span className="text-sm font-semibold text-ip-text">{d.computedAmount}</span>
                </div>
                <p className="mt-0.5 text-xs text-ip-text-muted">{new Date(d.createdAt).toLocaleString()}</p>
                <Input
                  className="mt-3 w-full"
                  placeholder="reject reason"
                  value={rejectReason[d.id] ?? ""}
                  onChange={(e) => setRejectReason({ ...rejectReason, [d.id]: e.target.value })}
                />
                <div className="mt-3 flex gap-2">
                  <Button className="flex-1" disabled={!canApprove || busyId === d.id} onClick={() => approve(d.id)}>
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="danger"
                    disabled={!canApprove || busyId === d.id}
                    onClick={() => reject(d.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border border-ip-border bg-ip-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ip-border text-left text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Reject reason</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disbursements.map((d) => (
                  <tr key={d.id} className="border-b border-ip-border last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-ip-text">{d.participantExternalRef}</td>
                    <td className="px-4 py-3">{d.computedAmount}</td>
                    <td className="px-4 py-3 text-ip-text-muted">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Input
                        placeholder="reason"
                        value={rejectReason[d.id] ?? ""}
                        onChange={(e) => setRejectReason({ ...rejectReason, [d.id]: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button disabled={!canApprove || busyId === d.id} onClick={() => approve(d.id)}>
                          Approve
                        </Button>
                        <Button variant="danger" disabled={!canApprove || busyId === d.id} onClick={() => reject(d.id)}>
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
