"use client";

import {
  LockPasswordIcon,
  Mail01Icon,
  UserIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signupSchema } from "@/lib/auth-validation";
import type { CurrencyGroup, CurrencyOption } from "@/lib/currencies";

type Copy = {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  currencyLabel: string;
  currencyHint: string;
  currencyPlaceholder: string;
  currencyNoResults: string;
  currencyOpen: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  continue: string;
  loading: string;
  signupFailed: string;
  invalidName: string;
  invalidEmail: string;
  invalidCurrency: string;
  passwordTooShort: string;
  loginPrompt: string;
  loginLink: string;
};

type FieldErrors = Partial<
  Record<"name" | "email" | "currency" | "password", string>
>;

export function SignupForm({
  copy,
  currencyGroups,
}: {
  copy: Copy;
  currencyGroups: CurrencyGroup[];
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState<CurrencyOption | null>(() =>
    currencyGroups[0]?.items.find((option) => option.value === "USD") ?? null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  async function handleSubmit(form: FormData) {
    const validation = signupSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      currency: form.get("currency"),
      password: form.get("password"),
    });

    setError(undefined);
    setFieldErrors({});

    if (!validation.success) {
      const fields = z.flattenError(validation.error).fieldErrors;
      setFieldErrors({
        name: fields.name ? copy.invalidName : undefined,
        email: fields.email ? copy.invalidEmail : undefined,
        currency: fields.currency ? copy.invalidCurrency : undefined,
        password: fields.password ? copy.passwordTooShort : undefined,
      });
      return;
    }

    setPending(true);
    const { data, error: signUpError } = await authClient.signUp.email({
      ...validation.data,
      role: "teacher",
    });

    if (signUpError || !data) {
      setError(copy.signupFailed);
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form
      className="auth-form space-y-5"
      action={handleSubmit}
      noValidate
      onChange={(event) =>
        setCanSubmit(
          signupSchema.safeParse(
            Object.fromEntries(new FormData(event.currentTarget)),
          ).success,
        )
      }>
      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="name">
          {copy.nameLabel}
        </label>
        <div className="group relative">
          <HugeiconsIcon
            icon={UserIcon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2 text-orbit-ink/55 transition-colors group-focus-within:text-orbit-ink"
          />
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder={copy.namePlaceholder}
            required
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            className="h-12 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 ps-12 pe-4 text-sm font-semibold transition-[border-color,box-shadow,transform] placeholder:text-orbit-ink/45 focus:-translate-y-px focus:border-orbit-ink/60 focus:ring-4 focus:ring-orbit-ink/10"
          />
        </div>
        {fieldErrors.name && (
          <p id="name-error" className="text-sm font-semibold  text-red-500">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="email">
          {copy.emailLabel}
        </label>
        <div className="group relative">
          <HugeiconsIcon
            icon={Mail01Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute inset-s-4 top-1/2 -translate-y-1/2 text-orbit-ink/55 transition-colors group-focus-within:text-orbit-ink"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder={copy.emailPlaceholder}
            required
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="h-12 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 ps-12 pe-4 text-sm font-semibold transition-[border-color,box-shadow,transform] placeholder:text-orbit-ink/45 focus:-translate-y-px focus:border-orbit-ink/60 focus:ring-4 focus:ring-orbit-ink/10"
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="text-sm font-semibold  text-red-500">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="currency">
          {copy.currencyLabel}
        </label>
        <Combobox
          items={currencyGroups}
          name="currency"
          value={currency}
          onValueChange={setCurrency}
          itemToStringLabel={(option: CurrencyOption) =>
            `${option.value} — ${option.label}`
          }
          itemToStringValue={(option: CurrencyOption) => option.value}
          autoHighlight
          required
          disabled={pending}>
          <ComboboxInputGroup>
            <ComboboxInput
              id="currency"
              placeholder={copy.currencyPlaceholder}
              aria-invalid={Boolean(fieldErrors.currency)}
              aria-describedby={
                fieldErrors.currency ? "currency-error" : "currency-hint"
              }
              disabled={pending}
            />
            <ComboboxTrigger
              aria-label={copy.currencyOpen}
              disabled={pending}
            />
          </ComboboxInputGroup>
          <ComboboxContent>
            <ComboboxEmpty>{copy.currencyNoResults}</ComboboxEmpty>
            <ComboboxList>
              {(group: CurrencyGroup) => (
                <ComboboxGroup
                  key={group.value}
                  items={group.items}
                  className={
                    group.value === currencyGroups[1]?.value
                      ? "mt-1 border-t border-orbit-strong/20 pt-1 dark:border-border"
                      : undefined
                  }>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  <ComboboxCollection>
                    {(option: CurrencyOption, index: number) => (
                      <ComboboxItem
                        key={option.value}
                        value={option}
                        className="m-0"
                        style={
                          {
                            "--combobox-item-delay": `${Math.min(index, 8) * 25}ms`,
                          } as CSSProperties
                        }>
                        {option.label} ({option.value})
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {fieldErrors.currency ? (
          <p id="currency-error" className="text-sm font-semibold text-red-500">
            {fieldErrors.currency}
          </p>
        ) : (
          <p id="currency-hint" className="text-sm text-orbit-ink/60">
            {copy.currencyHint}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold" htmlFor="password">
          {copy.passwordLabel}
        </label>
        <div className="group relative">
          <HugeiconsIcon
            icon={LockPasswordIcon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-orbit-ink/55 transition-colors group-focus-within:text-orbit-ink"
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            enterKeyHint="done"
            placeholder={copy.passwordPlaceholder}
            required
            minLength={8}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
            className="h-12 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 ps-12 pe-12 text-sm font-semibold transition-[border-color,box-shadow,transform] placeholder:text-orbit-ink/45 focus:-translate-y-px focus:border-orbit-ink/60 focus:ring-4 focus:ring-orbit-ink/10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute inset-e-3 top-1/2 -translate-y-1/2 rounded-lg text-orbit-ink/60 hover:bg-orbit-ink/10 hover:text-orbit-ink focus-visible:ring-2 focus-visible:ring-orbit-ink"
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            onClick={() => setShowPassword((visible) => !visible)}>
            <HugeiconsIcon
              icon={showPassword ? ViewOffIcon : ViewIcon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </Button>
        </div>
        {fieldErrors.password && (
          <p
            id="password-error"
            className="text-sm font-semibold text-red-500">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending || !canSubmit}
        className="h-12 w-full rounded-xl bg-orbit-ink px-4 text-sm font-black text-orbit-paper-strong transition-transform hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-orbit-ink/30 disabled:cursor-wait">
        {pending ? copy.loading : copy.continue}
      </Button>

      <p className="text-center text-sm font-semibold text-orbit-ink/80">
        {copy.loginPrompt}
        <Button
          asChild
          variant="link"
          className="h-auto px-1 py-0 text-orbit-ink underline-offset-2">
          <Link href="/login">{copy.loginLink}</Link>
        </Button>
      </p>
    </form>
  );
}
