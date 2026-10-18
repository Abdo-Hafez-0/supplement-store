import { cn } from "@/components/ui/cn";
import { ShieldIcon } from "@/components/ui/icons";

/** The client's trust badges from Settings (e.g. "Secure checkout"), as a row of short reassurances. */
export function TrustBadges({ badges, className }: { badges: string[]; className?: string }) {
  if (!badges.length) return null;
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8", className)}>
      {badges.map((badge) => (
        <li key={badge} className="flex items-center gap-2">
          <ShieldIcon className="size-5 text-highlight-text" />
          {badge}
        </li>
      ))}
    </ul>
  );
}
