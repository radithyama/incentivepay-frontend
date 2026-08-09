export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-ip-danger-light px-3.5 py-2.5 text-sm text-ip-danger">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ip-border px-4 py-8 text-center text-sm text-ip-text-muted">
      {message}
    </div>
  );
}
