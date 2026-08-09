import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface RoleInfo {
  role: string;
  tagline: string;
  tone: "primary" | "success" | "warning" | "neutral";
  canDo: string[];
}

const ROLES: RoleInfo[] = [
  {
    role: "Incentive Admin",
    tagline: "Owns the rules and the data feeding the whole pipeline",
    tone: "primary",
    canDo: [
      "Create and manage incentive rules (flat, percentage, tiered)",
      "Bulk-import incentive events via CSV",
      "Approve or reject new account requests, assigning their role",
    ],
  },
  {
    role: "Approver",
    tagline: "The gate for payouts above the auto-approve threshold",
    tone: "warning",
    canDo: [
      "Review the approvals queue for pending disbursements",
      "Approve a disbursement, sending it to the payment rail",
      "Reject a disbursement with a required reason",
    ],
  },
  {
    role: "Finance Ops",
    tagline: "Reconciliation - what's actually been paid",
    tone: "success",
    canDo: [
      "Look up any participant's ledger by their external reference",
      "See every completed disbursement, amount, and payment confirmation",
    ],
  },
  {
    role: "Viewer",
    tagline: "Read-only access, for anyone who just needs visibility",
    tone: "neutral",
    canDo: [
      "Browse the approvals queue and rules list (read-only)",
      "See buttons for admin/approver actions, but the server rejects them - a live look at how the RBAC is enforced",
    ],
  },
];

export function HowItWorks() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-ip-text">How IncentivePay works</h1>
        <p className="mt-1 text-sm text-ip-text-muted">
          Four roles share one dashboard. What you can click on depends on who you're signed in as - and every
          action is re-checked on the server, not just hidden in the UI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ROLES.map((r) => (
          <Card key={r.role} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-ip-text">{r.role}</h2>
              <Badge tone={r.tone}>{r.role.toLowerCase().replace(/\s+/g, "-")}</Badge>
            </div>
            <p className="text-sm text-ip-text-muted">{r.tagline}</p>
            <ul className="flex flex-col gap-1.5 text-sm text-ip-text">
              {r.canDo.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-0.5 text-ip-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ip-text">The end-to-end flow</h2>
        <ol className="flex flex-col gap-1.5 text-sm text-ip-text-muted">
          <li>1. An incentive event is recorded - one at a time, or in bulk via CSV import.</li>
          <li>2. A matching rule calculates the payout amount for that participant.</li>
          <li>3. Below the auto-approve threshold, it's disbursed automatically. Above it, it waits in the approvals queue.</li>
          <li>4. An approver signs off (or rejects with a reason).</li>
          <li>5. Approved disbursements are sent to the (simulated) payment rail and show up in the ledger.</li>
        </ol>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold text-ip-text">Getting an account</h2>
        <p className="text-sm text-ip-text-muted">
          New accounts start disabled. Submit a request with the role you need from the login screen, and an
          Incentive Admin approves it (and can adjust the role) before you can sign in.
        </p>
      </Card>
    </div>
  );
}
