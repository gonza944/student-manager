import { Badge } from "@/components/ui/badge";

export function ProfileTags({ values }: { values: string[] }) {
  return (
    <span className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge
          key={value}
          className="border-current/20 bg-orbit-paper-strong/55 text-orbit-ink">
          {value}
        </Badge>
      ))}
    </span>
  );
}
