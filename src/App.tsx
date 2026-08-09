import { useEffect, useState } from "react";
import { keycloak, currentRoles, currentUsername } from "./keycloak";
import { RulesPanel } from "./components/RulesPanel";
import { ApprovalsPanel } from "./components/ApprovalsPanel";
import { ImportPanel } from "./components/ImportPanel";
import { LedgerPanel } from "./components/LedgerPanel";
import "./App.css";

type Tab = "rules" | "approvals" | "import" | "ledger";

const TABS: { id: Tab; label: string }[] = [
  { id: "approvals", label: "Approvals" },
  { id: "import", label: "Bulk import" },
  { id: "rules", label: "Rules" },
  { id: "ledger", label: "Ledger" },
];

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("approvals");

  useEffect(() => {
    keycloak
      .init({ onLoad: "login-required", pkceMethod: "S256" })
      .then((auth) => {
        setAuthenticated(auth);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="loading">Connecting to Keycloak...</div>;
  }
  if (!authenticated) {
    return <div className="loading">Not authenticated.</div>;
  }

  return (
    <div className="app">
      <header>
        <h1>IncentivePay Ops</h1>
        <div className="identity">
          <span className="username">{currentUsername()}</span>
          <span className="roles">
            {currentRoles()
              .filter((r) => !r.startsWith("default-") && r !== "offline_access" && r !== "uma_authorization")
              .map((r) => (
                <span key={r} className="role-badge">
                  {r}
                </span>
              ))}
          </span>
          <button onClick={() => keycloak.logout()}>Log out</button>
        </div>
      </header>

      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "rules" && <RulesPanel />}
        {tab === "approvals" && <ApprovalsPanel />}
        {tab === "import" && <ImportPanel />}
        {tab === "ledger" && <LedgerPanel />}
      </main>
    </div>
  );
}
