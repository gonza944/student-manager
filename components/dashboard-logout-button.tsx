"use client";

import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type Copy = {
  label: string;
  pending: string;
  failed: string;
};

export function DashboardLogoutButton({ copy }: { copy: Copy }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function signOut() {
    setPending(true);
    setError(undefined);

    const { error: signOutError } = await authClient.signOut();
    if (signOutError) {
      setError(copy.failed);
      setPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={signOut}
        disabled={pending}
      >
        <HugeiconsIcon
          icon={Logout01Icon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        {pending ? copy.pending : copy.label}
      </Button>
      {error ? (
        <p
          role="alert"
          className="absolute end-0 top-full z-10 mt-2 w-56 rounded-md border border-red-500/35 bg-paper-strong px-3 py-2 text-xs font-semibold text-ink shadow-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
