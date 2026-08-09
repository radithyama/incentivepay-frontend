export type RuleType = "FLAT" | "PERCENTAGE" | "TIERED";
export type AppliesTo = "EMPLOYEE" | "PARTNER" | "BOTH";
export type ParticipantType = "EMPLOYEE" | "PARTNER";
export type DisbursementStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "DISBURSED" | "FAILED";
export type ImportRowOutcome = "IMPORTED" | "SKIPPED_DUPLICATE" | "FAILED";
export type Role = "incentive-admin" | "approver" | "finance-ops" | "viewer";

export const ALL_ROLES: Role[] = ["incentive-admin", "approver", "finance-ops", "viewer"];

export interface PendingRegistration {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  requestedRole: Role | null;
  createdTimestamp: number | null;
}

export interface Tier {
  minAmount: string;
  maxAmount: string | null;
  rate: string;
}

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  appliesTo: AppliesTo;
  flatAmount: string | null;
  percentage: string | null;
  tiers: Tier[];
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
}

export interface Participant {
  id: string;
  externalRef: string;
  displayName: string;
  email: string;
  type: ParticipantType;
  active: boolean;
}

export interface Disbursement {
  id: string;
  incentiveEventId: string;
  participantExternalRef: string;
  computedAmount: string;
  status: DisbursementStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRow {
  externalEventId: string | null;
  outcome: ImportRowOutcome;
  reason: string | null;
}

export interface ImportJobSummary {
  jobExecutionId: number;
  status: string;
  startTime: string | null;
  endTime: string | null;
  readCount: number;
  importedCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  rows: ImportRow[];
}

export interface LedgerEntry {
  id: string;
  disbursementId: string;
  amount: string;
  currency: string;
  disbursedAt: string;
  paymentRailConfirmationId: string | null;
}

export interface ParticipantLedger {
  participantExternalRef: string;
  totalPaid: string;
  entries: LedgerEntry[];
}
