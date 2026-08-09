import { useEffect, useState } from "react";
import { api, ApiError, uploadCsv } from "../api";
import { hasRole } from "../keycloak";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ErrorAlert, EmptyState } from "../ui/Alert";
import type { ImportJobSummary, ImportRowOutcome } from "../types";

const OUTCOME_TONE: Record<ImportRowOutcome, "success" | "warning" | "danger"> = {
  IMPORTED: "success",
  SKIPPED_DUPLICATE: "warning",
  FAILED: "danger",
};

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<ImportJobSummary | null>(null);
  const [recent, setRecent] = useState<ImportJobSummary[]>([]);

  const canImport = hasRole("incentive-admin");

  async function loadRecent() {
    try {
      setRecent(await api.get<ImportJobSummary[]>("/v1/imports"));
    } catch {
      // Non-fatal: the panel still works for a fresh upload without history.
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const summary = await uploadCsv<ImportJobSummary>("/v1/imports", file);
      setCurrent(summary);
      await loadRecent();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.status}: ${e.message}` : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ip-text">Bulk import</h1>
        <p className="mt-1 text-sm text-ip-text-muted">
          CSV columns:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
            participantId,ruleId,eventType,amount,externalEventId,occurredAt
          </code>{" "}
          (occurredAt is optional). Re-uploading the same externalEventId is a no-op, not a duplicate payout.
        </p>
      </div>

      {canImport && (
        <Card className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-ip-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ip-primary-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ip-primary hover:file:bg-indigo-100"
          />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Processing..." : "Upload & run"}
          </Button>
        </Card>
      )}
      {error && <ErrorAlert message={error} />}

      {current && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ip-text">
              Job #{current.jobExecutionId} <span className="text-ip-text-muted">- {current.status}</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-ip-text-muted">
            <span>Read: <span className="font-semibold text-ip-text">{current.readCount}</span></span>
            <span>Imported: <span className="font-semibold text-ip-success">{current.importedCount}</span></span>
            <span>Skipped: <span className="font-semibold text-ip-warning">{current.skippedDuplicateCount}</span></span>
            <span>Failed: <span className="font-semibold text-ip-danger">{current.failedCount}</span></span>
          </div>
          {current.rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-ip-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ip-border text-left text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                    <th className="px-3 py-2">External event id</th>
                    <th className="px-3 py-2">Outcome</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {current.rows.map((row, i) => (
                    <tr key={i} className="border-b border-ip-border last:border-0">
                      <td className="px-3 py-2">{row.externalEventId ?? "-"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={OUTCOME_TONE[row.outcome]}>{row.outcome}</Badge>
                      </td>
                      <td className="px-3 py-2 text-ip-text-muted">{row.reason ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-ip-text-muted">Recent runs</h2>
      {recent.length === 0 ? (
        <EmptyState message="No import runs yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ip-border bg-ip-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip-border text-left text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Imported</th>
                <th className="px-4 py-3">Skipped</th>
                <th className="px-4 py-3">Failed</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.jobExecutionId} className="border-b border-ip-border last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ip-text">{r.jobExecutionId}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">{r.importedCount}</td>
                  <td className="px-4 py-3">{r.skippedDuplicateCount}</td>
                  <td className="px-4 py-3">{r.failedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
