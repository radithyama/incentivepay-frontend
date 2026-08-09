import { useEffect, useState } from "react";
import { keycloak, currentRoles, currentUsername, hasRole } from "./keycloak";
import { LandingPage } from "./components/LandingPage";
import { RulesPanel } from "./components/RulesPanel";
import { ApprovalsPanel } from "./components/ApprovalsPanel";
import { ImportPanel } from "./components/ImportPanel";
import { LedgerPanel } from "./components/LedgerPanel";
import { PendingApprovalsPanel } from "./components/PendingApprovalsPanel";
import { HowItWorks } from "./components/HowItWorks";
import { Logo } from "./ui/Logo";

type Tab = "approvals" | "import" | "rules" | "ledger" | "pending" | "how";

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
  { id: "how", label: "How it works", icon: "?" },
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("approvals");
  const [menuOpen, setMenuOpen] = useState(false);

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

  function selectTab(id: Tab) {
    setTab(id);
    setMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-ip-bg">
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-ip-border
          bg-ip-surface transition-transform duration-200 md:static md:w-60 md:translate-x-0 ${
            menuOpen ? "translate-x-0" : ""
          }`}
      >
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTab(item.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-primary/40 ${
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
              className="rounded text-xs font-semibold text-ip-text-muted hover:text-ip-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-danger/40"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ip-border bg-ip-surface px-4 py-3 md:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-ip-text hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-primary/40"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Logo size={24} />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">
            {tab === "approvals" && <ApprovalsPanel />}
            {tab === "import" && <ImportPanel />}
            {tab === "rules" && <RulesPanel />}
            {tab === "ledger" && <LedgerPanel />}
            {tab === "pending" && isAdmin && <PendingApprovalsPanel />}
            {tab === "how" && <HowItWorks />}
          </div>
        </main>
      </div>
    </div>
  );
}
