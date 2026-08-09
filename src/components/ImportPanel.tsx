import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { api, friendlyErrorMessage, uploadCsv } from "../api";
import { hasRole } from "../keycloak";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/Alert";
import { useToast } from "../ui/Toast";
import type { ImportJobSummary, ImportRowOutcome } from "../types";

const OUTCOME_TONE: Record<ImportRowOutcome, "success" | "warning" | "danger"> = {
  IMPORTED: "success",
  SKIPPED_DUPLICATE: "warning",
  FAILED: "danger",
};

// externalEventId must be unique per import, so a stray double-download/upload of
// this exact file is harmlessly deduped rather than double-counted.
const CSV_TEMPLATE = [
  "participantId,ruleId,eventType,amount,externalEventId,occurredAt",
  "EMP-1001,00000000-0000-0000-0000-000000000000,referral,150.00,evt-2026-000123,2026-08-09T14:30:00Z",
].join("\n");
const CSV_TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [current, setCurrent] = useState<ImportJobSummary | null>(null);
  const [recent, setRecent] = useState<ImportJobSummary[]>([]);
  const toast = useToast();

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
    try {
      const summary = await uploadCsv<ImportJobSummary>("/v1/imports", file);
      setCurrent(summary);
      toast.success(`Import complete: ${summary.importedCount} imported, ${summary.failedCount} failed.`);
      await loadRecent();
    } catch (e) {
      toast.error(friendlyErrorMessage(e, "The import failed to run."));
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
        <a
          href={CSV_TEMPLATE_HREF}
          download="incentive-events-template.csv"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ip-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" />
          Download example CSV
        </a>
        <p className="mt-1 text-xs text-ip-text-muted">
          The example row's <code className="rounded bg-slate-100 px-1 py-0.5">ruleId</code> is a placeholder - swap
          it for a real rule's ID from the <code className="rounded bg-slate-100 px-1 py-0.5">Rules</code> tab, and{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5">participantId</code> for a real participant's external
          reference (e.g. <code className="rounded bg-slate-100 px-1 py-0.5">EMP-1001</code>).
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
            <>
              <div className="flex flex-col gap-2 md:hidden">
                {current.rows.map((row, i) => (
                  <div key={i} className="rounded-lg border border-ip-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-ip-text">{row.externalEventId ?? "-"}</span>
                      <Badge tone={OUTCOME_TONE[row.outcome]}>{row.outcome}</Badge>
                    </div>
                    {row.reason && <p className="mt-1 text-xs text-ip-text-muted">{row.reason}</p>}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-lg border border-ip-border md:block">
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
            </>
          )}
        </Card>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-ip-text-muted">Recent runs</h2>
      {recent.length === 0 ? (
        <EmptyState message="No import runs yet." />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {recent.map((r) => (
              <div key={r.jobExecutionId} className="rounded-xl border border-ip-border bg-ip-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ip-text">Job #{r.jobExecutionId}</span>
                  <span className="text-xs text-ip-text-muted">{r.status}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-ip-text-muted">
                  <span>Imported: <span className="font-semibold text-ip-success">{r.importedCount}</span></span>
                  <span>Skipped: <span className="font-semibold text-ip-warning">{r.skippedDuplicateCount}</span></span>
                  <span>Failed: <span className="font-semibold text-ip-danger">{r.failedCount}</span></span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-ip-border bg-ip-surface md:block">
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
        </>
      )}
    </div>
  );
}
