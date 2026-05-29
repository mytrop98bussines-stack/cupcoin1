import { cn } from "@/utils/cn";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={cn(
            "w-full appearance-none rounded-xl border bg-white dark:bg-white/5 text-gray-900 dark:text-white transition-all duration-200",
            "border-gray-200 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none",
            "px-4 py-3 text-sm pr-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
