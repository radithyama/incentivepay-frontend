import { useState } from "react";
import { keycloak } from "../keycloak";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { RegisterForm } from "./RegisterForm";
import { HowItWorks } from "./HowItWorks";
import { Logo } from "../ui/Logo";

export function LandingPage() {
  const [mode, setMode] = useState<"welcome" | "register" | "how">("welcome");

  if (mode === "how") {
    return (
      <div className="min-h-screen bg-ip-bg px-4 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-5">
          <div className="flex items-center justify-between">
            <Logo />
            <Button variant="secondary" onClick={() => setMode("welcome")}>
              Back to login
            </Button>
          </div>
          <HowItWorks />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ip-bg px-4 sm:px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={36} />
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
                className="rounded text-sm text-ip-text-muted hover:text-ip-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-primary/40"
              >
                New here? Request an account
              </button>
              <button
                type="button"
                onClick={() => setMode("how")}
                className="rounded text-sm text-ip-text-muted hover:text-ip-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ip-primary/40"
              >
                What can each role do?
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
