import type { ReactNode } from "react";

export function ProfileDetail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 border-t border-current/20 py-4">
      <dt className="text-caption font-bold uppercase tracking-[0.12em] opacity-65">
        {label}
      </dt>
      <dd className="mt-2 min-w-0 wrap-break-word font-semibold">{children}</dd>
    </div>
  );
}
