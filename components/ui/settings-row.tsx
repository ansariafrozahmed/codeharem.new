import type { ReactNode } from "react";

type Props = {
  label: string;
  hint?: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
};

/** One row of a settings card: label + hint on the left, control on the right. */
export function SettingsRow({ label, hint, htmlFor, error, children }: Props) {
  const Label = htmlFor ? "label" : "p";
  return (
    <div className="grid gap-3 px-5 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-8 md:px-6">
      <div>
        <Label {...(htmlFor ? { htmlFor } : {})} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        {hint && <p className="mt-1 text-[13px] leading-snug text-white/45">{hint}</p>}
      </div>
      <div>
        {children}
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
