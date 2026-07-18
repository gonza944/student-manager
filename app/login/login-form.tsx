"use client";

import {
  CheckmarkCircle01Icon,
  CircleIcon,
  LockPasswordIcon,
  Mail01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { Button } from "@/components/ui/button";
import { credentialsSchema } from "@/lib/auth-validation";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Copy = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  rememberMe: string;
  continue: string;
  loading: string;
  invalidCredentials: string;
  notTeacher: string;
  invalidEmail: string;
  passwordTooShort: string;
  signupPrompt: string;
  signupLink: string;
};

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm({ copy }: { copy: Copy }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  async function handleSubmit(form: FormData) {
    const validation = credentialsSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });

    setError(undefined);
    setFieldErrors({});

    if (!validation.success) {
      const fields = z.flattenError(validation.error).fieldErrors;
      setFieldErrors({
        email: fields.email ? copy.invalidEmail : undefined,
        password: fields.password ? copy.passwordTooShort : undefined,
      });
      return;
    }

    setPending(true);
    const { data, error: signInError } = await authClient.signIn.email({
      ...validation.data,
      rememberMe: form.get("remember") === "on",
    });

    if (signInError || !data) {
      setError(copy.invalidCredentials);
      setPending(false);
      return;
    }

    if (data.user.role !== "teacher") {
      await authClient.signOut();
      setError(copy.notTeacher);
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
          credentialsSchema.safeParse(
            Object.fromEntries(new FormData(event.currentTarget)),
          ).success,
        )
      }>
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
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            required
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="h-12 rounded-xl border-orbit-ink/20 bg-orbit-paper-strong/70 ps-12 pe-4 text-sm font-semibold transition-[border-color,box-shadow,transform] placeholder:text-orbit-ink/45 focus:-translate-y-px focus:border-orbit-ink/60 focus:ring-4 focus:ring-orbit-ink/10"
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="text-sm font-semibold text-red-500">
            {fieldErrors.email}
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
            autoComplete="current-password"
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

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-orbit-ink/80 has-[:disabled]:cursor-wait has-[:disabled]:opacity-70">
        <input
          name="remember"
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.currentTarget.checked)}
          disabled={pending}
          className="peer sr-only"
        />
        <span className="pointer-events-none relative grid size-5 shrink-0 place-items-center peer-focus-visible:rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orbit-ink">
          <HugeiconsIcon
            icon={CircleIcon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`absolute text-orbit-ink/65 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${remember ? "scale-75 -rotate-45 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
          />
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={`absolute text-orbit-ink transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none ${remember ? "scale-100 rotate-0 opacity-100" : "scale-75 rotate-45 opacity-0"}`}
          />
        </span>
        <span>{copy.rememberMe}</span>
      </label>

      {error && (
        <p
          role="alert"
          className="px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <LiquidButton
        type="submit"
        fillHeight="0"
        disabled={pending || !canSubmit}
        className="h-12 w-full rounded-xl px-4 text-sm font-black text-orbit-paper-strong shadow-none hover:text-orbit-ink focus-visible:ring-4 focus-visible:ring-orbit-ink/30 disabled:cursor-wait [--liquid-button-background-color:var(--orbit-ink)] [--liquid-button-color:var(--orbit-paper-strong)]">
        {pending ? copy.loading : copy.continue}
      </LiquidButton>

      <p className="text-center text-sm font-semibold text-orbit-ink/80">
        {copy.signupPrompt}
        <Button
          asChild
          variant="link"
          className="h-auto px-1 py-0 text-orbit-ink underline-offset-2">
          <Link href="/signup">{copy.signupLink}</Link>
        </Button>
      </p>
    </form>
  );
}
