import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  verified?: boolean;
  size?:     "sm" | "md" | "lg";
}

export function VerifiedBadge({ verified, size = "sm" }: VerifiedBadgeProps) {
  if (!verified) return null;

  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <BadgeCheck
      className={`${sizes[size]} fill-blue-500 text-white flex-shrink-0`}
      title="Trader verificado"
    />
  );
}
