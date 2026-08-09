import { useEffect, useState } from "react";
import { api, ApiError, uploadCsv } from "../api";
import { hasRole } from "../keycloak";
import type { ImportJobSummary } from "../types";

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
    <div className="panel">
      <h2>Bulk import</h2>
      <p className="hint">
        CSV columns: <code>participantId,ruleId,eventType,amount,externalEventId,occurredAt</code> (occurredAt is
        optional). Re-uploading the same <code>externalEventId</code> is a no-op, not a duplicate payout.
      </p>

      {canImport && (
        <div className="card">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Processing..." : "Upload & run"}
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {current && (
        <div className="card">
          <h3>Job #{current.jobExecutionId} - {current.status}</h3>
          <p>
            Read: {current.readCount} | Imported: {current.importedCount} | Skipped duplicates:{" "}
            {current.skippedDuplicateCount} | Failed: {current.failedCount}
          </p>
          {current.rows.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>External event id</th>
                  <th>Outcome</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {current.rows.map((row, i) => (
                  <tr key={i}>
                    <td>{row.externalEventId ?? "-"}</td>
                    <td>{row.outcome}</td>
                    <td>{row.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <h3>Recent runs</h3>
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Status</th>
            <th>Imported</th>
            <th>Skipped</th>
            <th>Failed</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.jobExecutionId}>
              <td>{r.jobExecutionId}</td>
              <td>{r.status}</td>
              <td>{r.importedCount}</td>
              <td>{r.skippedDuplicateCount}</td>
              <td>{r.failedCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
