export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/logo.svg" alt="IncentivePay" width={size} height={size} className="shrink-0 rounded" />
      {withWordmark && (
        <span className="text-lg font-bold tracking-tight text-ip-text">
          Incentive<span className="text-ip-primary">Pay</span>
        </span>
      )}
    </span>
  );
}
