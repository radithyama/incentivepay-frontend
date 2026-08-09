import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { hasRole } from "../keycloak";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { ErrorAlert, EmptyState } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import type { AppliesTo, Rule, RuleType, Tier } from "../types";

const emptyTier = (): Tier => ({ minAmount: "0", maxAmount: "", rate: "0.05" });

export function RulesPanel() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<RuleType>("FLAT");
  const [appliesTo, setAppliesTo] = useState<AppliesTo>("BOTH");
  const [flatAmount, setFlatAmount] = useState("100.00");
  const [percentage, setPercentage] = useState("0.05");
  const [tiers, setTiers] = useState<Tier[]>([emptyTier()]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const canManage = hasRole("incentive-admin");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRules(await api.get<Rule[]>("/v1/rules"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name, type, appliesTo, effectiveFrom };
      if (type === "FLAT") payload.flatAmount = flatAmount;
      if (type === "PERCENTAGE") payload.percentage = percentage;
      if (type === "TIERED") payload.tiers = tiers;

      await api.post("/v1/rules", payload);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ip-text">Incentive rules</h1>
      {error && <ErrorAlert message={error} />}

      {canManage && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="font-semibold text-ip-text">New rule</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field label="Type">
                <Select value={type} onChange={(e) => setType(e.target.value as RuleType)}>
                  <option value="FLAT">FLAT</option>
                  <option value="PERCENTAGE">PERCENTAGE</option>
                  <option value="TIERED">TIERED</option>
                </Select>
              </Field>
              <Field label="Applies to">
                <Select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}>
                  <option value="BOTH">BOTH</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="PARTNER">PARTNER</option>
                </Select>
              </Field>
              <Field label="Effective from">
                <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
              </Field>

              {type === "FLAT" && (
                <Field label="Flat amount">
                  <Input value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} required />
                </Field>
              )}
              {type === "PERCENTAGE" && (
                <Field label="Percentage (0.05 = 5%)">
                  <Input value={percentage} onChange={(e) => setPercentage(e.target.value)} required />
                </Field>
              )}
            </div>

            {type === "TIERED" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                  Tiers (marginal, like a tax bracket)
                </p>
                {tiers.map((tier, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="min"
                      value={tier.minAmount}
                      onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, minAmount: e.target.value } : t)))}
                    />
                    <Input
                      placeholder="max (blank = unbounded)"
                      value={tier.maxAmount ?? ""}
                      onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, maxAmount: e.target.value || null } : t)))}
                    />
                    <Input
                      placeholder="rate"
                      value={tier.rate}
                      onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, rate: e.target.value } : t)))}
                    />
                  </div>
                ))}
                <Button type="button" variant="secondary" className="self-start" onClick={() => setTiers([...tiers, emptyTier()])}>
                  + Add tier
                </Button>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Creating..." : "Create rule"}
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-ip-text-muted">Loading...</p>
      ) : rules.length === 0 ? (
        <EmptyState message="No rules yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ip-border bg-ip-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ip-border text-left text-xs font-semibold uppercase tracking-wide text-ip-text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Applies to</th>
                <th className="px-4 py-3">Effective from</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-ip-border last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ip-text">{r.name}</td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">{r.appliesTo}</td>
                  <td className="px-4 py-3 text-ip-text-muted">{r.effectiveFrom}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.active ? "success" : "neutral"}>{r.active ? "active" : "inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
