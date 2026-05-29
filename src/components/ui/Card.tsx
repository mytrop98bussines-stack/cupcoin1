import { cn } from "@/utils/cn";
import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({
  children,
  padding = "md",
  hover = false,
  className,
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] transition-all duration-200",
        hover && "hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 cursor-pointer active:scale-[0.99]",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
