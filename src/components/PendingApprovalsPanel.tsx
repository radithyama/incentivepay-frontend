import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Select } from "../ui/Field";
import { ErrorAlert, EmptyState } from "../ui/Alert";
import { ALL_ROLES, type PendingRegistration, type Role } from "../types";

export function PendingApprovalsPanel() {
  const [pending, setPending] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, Role>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const users = await api.get<PendingRegistration[]>("/v1/admin/pending-registrations");
      setPending(users);
      setSelectedRole((prev) => {
        const next = { ...prev };
        for (const u of users) {
          next[u.id] ??= u.requestedRole ?? "viewer";
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Failed to load pending registrations");
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
      await api.post(`/v1/admin/pending-registrations/${id}/approve`, { role: selectedRole[id] ?? "viewer" });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.delete(`/v1/admin/pending-registrations/${id}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ip-text">Pending approvals</h1>
        <p className="mt-1 text-sm text-ip-text-muted">
          New accounts land here disabled, with no role, until you approve them.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <p className="text-sm text-ip-text-muted">Loading...</p>
      ) : pending.length === 0 ? (
        <EmptyState message="No pending registrations." />
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ip-text">
                  {u.firstName} {u.lastName} <span className="text-ip-text-muted">@{u.username}</span>
                </p>
                <p className="text-sm text-ip-text-muted">{u.email}</p>
                {u.requestedRole && (
                  <p className="mt-1 text-xs text-ip-text-muted">requested: {u.requestedRole}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedRole[u.id] ?? "viewer"}
                  onChange={(e) => setSelectedRole({ ...selectedRole, [u.id]: e.target.value as Role })}
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
                <Button disabled={busyId === u.id} onClick={() => approve(u.id)}>
                  Approve
                </Button>
                <Button variant="danger" disabled={busyId === u.id} onClick={() => reject(u.id)}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
