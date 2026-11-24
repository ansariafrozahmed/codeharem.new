import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";

export const inputClass =
  "w-full rounded-action border border-white/10 bg-background px-3 text-sm text-foreground placeholder:text-white/30 outline-none transition " +
  "hover:border-white/20 focus:border-leaf/70 focus:ring-2 focus:ring-leaf/20 " +
  "disabled:cursor-not-allowed disabled:text-white/50 read-only:text-white/60 aria-invalid:border-red-400/60";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`h-10 ${inputClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`min-h-24 resize-y py-2.5 leading-relaxed ${inputClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select className={`h-10 cursor-pointer appearance-none pr-9 ${inputClass} ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/50" />
    </div>
  );
}

/** Label + control + error, stacked. For forms that aren't in settings rows. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-white/80">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}
