import { useEffect, useState } from "react";
import { keycloak, currentRoles, currentUsername, hasRole } from "./keycloak";
import { LandingPage } from "./components/LandingPage";
import { RulesPanel } from "./components/RulesPanel";
import { ApprovalsPanel } from "./components/ApprovalsPanel";
import { ImportPanel } from "./components/ImportPanel";
import { LedgerPanel } from "./components/LedgerPanel";
import { PendingApprovalsPanel } from "./components/PendingApprovalsPanel";

type Tab = "approvals" | "import" | "rules" | "ledger" | "pending";

interface NavItem {
  id: Tab;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "approvals", label: "Approvals", icon: "✓" },
  { id: "import", label: "Bulk import", icon: "⇪" },
  { id: "rules", label: "Rules", icon: "⚙" },
  { id: "ledger", label: "Ledger", icon: "▤" },
  { id: "pending", label: "Pending approvals", icon: "◷", adminOnly: true },
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("approvals");

  useEffect(() => {
    keycloak
      .init({ onLoad: "check-sso", pkceMethod: "S256", silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html` })
      .then((auth) => {
        setAuthenticated(auth);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ip-bg text-sm text-ip-text-muted">
        Loading...
      </div>
    );
  }
  if (!authenticated) {
    return <LandingPage />;
  }

  const isAdmin = hasRole("incentive-admin");
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen bg-ip-bg">
      <aside className="flex w-60 flex-col border-r border-ip-border bg-ip-surface">
        <div className="px-5 py-5">
          <span className="text-lg font-bold tracking-tight text-ip-text">
            Incentive<span className="text-ip-primary">Pay</span>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === item.id
                  ? "bg-ip-primary-light text-ip-primary"
                  : "text-ip-text-muted hover:bg-slate-100 hover:text-ip-text"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-ip-border p-3">
          <div className="flex flex-wrap gap-1 px-2 pb-2">
            {currentRoles()
              .filter((r) => !r.startsWith("default-") && r !== "offline_access" && r !== "uma_authorization")
              .map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                >
                  {r}
                </span>
              ))}
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="truncate text-sm font-medium text-ip-text">{currentUsername()}</span>
            <button
              onClick={() => keycloak.logout()}
              className="text-xs font-semibold text-ip-text-muted hover:text-ip-danger"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-5xl">
          {tab === "approvals" && <ApprovalsPanel />}
          {tab === "import" && <ImportPanel />}
          {tab === "rules" && <RulesPanel />}
          {tab === "ledger" && <LedgerPanel />}
          {tab === "pending" && isAdmin && <PendingApprovalsPanel />}
        </div>
      </main>
    </div>
  );
}
