import { useState, type FormEvent } from "react";
import { ApiError, publicApi } from "../api";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { ErrorAlert } from "../ui/Alert";
import { ALL_ROLES, type Role } from "../types";

const ROLE_LABELS: Record<Role, string> = {
  "incentive-admin": "Incentive Admin - manage rules & participants",
  approver: "Approver - approve/reject disbursements",
  "finance-ops": "Finance Ops - view the ledger",
  viewer: "Viewer - read-only",
};

export function RegisterForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<Role>("viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await publicApi.post("/v1/auth/register", { username, email, displayName, password, requestedRole });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed - please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ip-success-light text-ip-success">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-ip-text">Request submitted</h2>
        <p className="mt-2 text-sm text-ip-text-muted">
          An <span className="font-medium">incentive-admin</span> needs to approve your account before you can log
          in. Check back once you've heard from them.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={onBackToLogin}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ip-text">Request an account</h2>
      {error && <ErrorAlert message={error} />}

      <Field label="Username">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Full name">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </Field>
      <Field label="Password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </Field>
      <Field label="Role you're requesting">
        <Select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value as Role)}>
          {ALL_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit request"}
      </Button>
      <button type="button" onClick={onBackToLogin} className="text-sm text-ip-text-muted hover:text-ip-text">
        Already have an account? Log in
      </button>
    </form>
  );
}
