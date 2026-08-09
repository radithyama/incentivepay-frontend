import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { hasRole } from "../keycloak";
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
    <div className="panel">
      <h2>Incentive Rules</h2>
      {error && <p className="error">{error}</p>}

      {canManage && (
        <form onSubmit={handleSubmit} className="card">
          <h3>New rule</h3>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as RuleType)}>
              <option value="FLAT">FLAT</option>
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="TIERED">TIERED</option>
            </select>
          </label>
          <label>
            Applies to
            <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}>
              <option value="BOTH">BOTH</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
              <option value="PARTNER">PARTNER</option>
            </select>
          </label>
          <label>
            Effective from
            <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
          </label>

          {type === "FLAT" && (
            <label>
              Flat amount
              <input value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} required />
            </label>
          )}
          {type === "PERCENTAGE" && (
            <label>
              Percentage (0.05 = 5%)
              <input value={percentage} onChange={(e) => setPercentage(e.target.value)} required />
            </label>
          )}
          {type === "TIERED" && (
            <div>
              <p>Tiers (marginal, like a tax bracket)</p>
              {tiers.map((tier, i) => (
                <div key={i} className="tier-row">
                  <input
                    placeholder="min"
                    value={tier.minAmount}
                    onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, minAmount: e.target.value } : t)))}
                  />
                  <input
                    placeholder="max (blank = unbounded)"
                    value={tier.maxAmount ?? ""}
                    onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, maxAmount: e.target.value || null } : t)))}
                  />
                  <input
                    placeholder="rate"
                    value={tier.rate}
                    onChange={(e) => setTiers(tiers.map((t, j) => (j === i ? { ...t, rate: e.target.value } : t)))}
                  />
                </div>
              ))}
              <button type="button" onClick={() => setTiers([...tiers, emptyTier()])}>
                + Add tier
              </button>
            </div>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create rule"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Applies to</th>
              <th>Effective from</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.appliesTo}</td>
                <td>{r.effectiveFrom}</td>
                <td>{r.active ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
