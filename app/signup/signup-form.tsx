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
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { signupSchema } from "@/lib/auth-validation";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Copy = {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  continue: string;
  loading: string;
  signupFailed: string;
  invalidName: string;
  invalidEmail: string;
  passwordTooShort: string;
  loginPrompt: string;
  loginLink: string;
};

type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export function SignupForm({ copy }: { copy: Copy }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  async function handleSubmit(form: FormData) {
    const validation = signupSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    });

    setError(undefined);
    setFieldErrors({});

    if (!validation.success) {
      const fields = z.flattenError(validation.error).fieldErrors;
      setFieldErrors({
        name: fields.name ? copy.invalidName : undefined,
        email: fields.email ? copy.invalidEmail : undefined,
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
