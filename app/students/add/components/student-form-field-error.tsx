export function StudentFormFieldError({
  invalid,
  id,
  message,
}: {
  invalid: boolean;
  id: string;
  message: string;
}) {
  return invalid ? (
    <p id={id} className="text-xs font-bold text-destructive">
      {message}
    </p>
  ) : null;
}
