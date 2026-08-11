"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateCommissionSettingsAction } from "../actions";

type Copy = {
  preplyLabel: string;
  preplyHint: string;
  directLabel: string;
  directHint: string;
  save: string;
  saving: string;
  success: string;
  error: string;
};

export function SettingsForm({
  copy,
  initialPreplyCommissionBps,
  initialDirectCommissionBps,
}: {
  copy: Copy;
  initialPreplyCommissionBps: number;
  initialDirectCommissionBps: number;
}) {
  const router = useRouter();
  const [preplyFee, setPreplyFee] = useState(
    (initialPreplyCommissionBps / 100).toFixed(2),
  );
  const [directFee, setDirectFee] = useState(
    (initialDirectCommissionBps / 100).toFixed(2),
  );
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const submit = () => {
    setError(false);
    startTransition(async () => {
      const result = await updateCommissionSettingsAction({
        preplyCommissionBps: Math.round(Number(preplyFee) * 100),
        directCommissionBps: Math.round(Number(directFee) * 100),
      });
      if (!result.ok) {
        setError(true);
        toast.error(copy.error);
        return;
      }

      setPreplyFee((result.data.preplyCommissionBps / 100).toFixed(2));
      setDirectFee((result.data.directCommissionBps / 100).toFixed(2));
      toast.success(copy.success);
      router.refresh();
    });
  };

  return (
    <form
      className="grid max-w-md gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}>
      <div className="grid gap-2">
        <Label htmlFor="preply-fee">{copy.preplyLabel}</Label>
        <div className="relative">
          <Input
            id="preply-fee"
            name="preplyFee"
            type="number"
            min="0"
            max="100"
            step="0.01"
            inputMode="decimal"
            enterKeyHint="next"
            value={preplyFee}
            required
            aria-describedby="preply-fee-hint"
            className="h-12 rounded-xl pe-10 text-base"
            onChange={(event) => setPreplyFee(event.target.value)}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-e-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
            %
          </span>
        </div>
        <p id="preply-fee-hint" className="text-sm text-muted-foreground">
          {copy.preplyHint}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="direct-fee">{copy.directLabel}</Label>
        <div className="relative">
          <Input
            id="direct-fee"
            name="directFee"
            type="number"
            min="0"
            max="100"
            step="0.01"
            inputMode="decimal"
            enterKeyHint="done"
            value={directFee}
            required
            aria-describedby="direct-fee-hint"
            className="h-12 rounded-xl pe-10 text-base"
            onChange={(event) => setDirectFee(event.target.value)}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-e-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
            %
          </span>
        </div>
        <p id="direct-fee-hint" className="text-sm text-muted-foreground">
          {copy.directHint}
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {copy.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="min-h-12 w-fit rounded-full px-6">
        {pending ? copy.saving : copy.save}
      </Button>
    </form>
  );
}
