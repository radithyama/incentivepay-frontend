import { useState } from "react";
import { keycloak } from "../keycloak";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { RegisterForm } from "./RegisterForm";

export function LandingPage() {
  const [mode, setMode] = useState<"welcome" | "register">("welcome");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ip-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="text-2xl font-bold tracking-tight text-ip-text">
            Incentive<span className="text-ip-primary">Pay</span>
          </span>
        </div>

        <Card>
          {mode === "welcome" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-lg font-semibold text-ip-text">Welcome</h1>
                <p className="mt-1 text-sm text-ip-text-muted">
                  Sign in to manage rules, approve disbursements, or check the ledger.
                </p>
              </div>
              <Button onClick={() => keycloak.login()}>Log in</Button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-sm text-ip-text-muted hover:text-ip-text"
              >
                New here? Request an account
              </button>
            </div>
          ) : (
            <RegisterForm onBackToLogin={() => setMode("welcome")} />
          )}
        </Card>
      </div>
    </div>
  );
}
