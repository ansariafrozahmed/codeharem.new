import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

type StyleProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type IconProps = {
  /** Icon shown before the label */
  iconLeft?: ReactNode;
  /** Icon shown after the label */
  iconRight?: ReactNode;
};

const base =
  "group/btn relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-action font-normal " +
  "transition-[transform,box-shadow,background-position,background-color,border-color,color] duration-300 ease-out " +
  "hover:-translate-y-px active:translate-y-0 active:scale-[0.98] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<Variant, string> = {
  // Leaf → pine gradient. Hover slides the gradient toward the bright end and adds a glow.
  primary:
    "text-white bg-[linear-gradient(135deg,#143f39_0%,#429872_100%)] bg-[length:220%_220%] bg-[position:60%_60%] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)] " +
    "hover:bg-[position:0%_0%] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_0_1px_rgba(255,255,255,0.1),0_8px_24px_-8px_rgba(66,152,114,0.75)]",
  // Bordered. Hover tints the border and fill with leaf.
  secondary:
    "border border-white/15 bg-white/[0.02] text-white/85 " +
    "hover:border-leaf/60 hover:bg-leaf/10 hover:text-white",
};

// Gap between icon and label, and icon size, scale with the button.
const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-[12px] [&_svg]:size-3.5",
  md: "h-9 gap-2 px-4 text-[13px] [&_svg]:size-4",
  lg: "h-11 gap-2.5 px-5 text-[14px] [&_svg]:size-[18px]",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
}: StyleProps = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

function Content({
  iconLeft,
  iconRight,
  children,
}: IconProps & { children?: ReactNode }) {
  return (
    <>
      {iconLeft && (
        <span
          aria-hidden
          className="inline-flex shrink-0 transition-transform duration-300 "
        >
          {iconLeft}
        </span>
      )}
      {children}
      {iconRight && (
        <span
          aria-hidden
          className="inline-flex shrink-0 transition-transform duration-300 "
        >
          {iconRight}
        </span>
      )}
    </>
  );
}

/** <Button variant="primary" | "secondary" size="sm" | "md" | "lg" iconLeft={…} iconRight={…}> */
export function Button({
  variant,
  size,
  className,
  iconLeft,
  iconRight,
  children,
  type = "button",
  ...props
}: StyleProps & IconProps & ComponentProps<"button">) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    >
      <Content iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </Content>
    </button>
  );
}

/** Same look as <Button>, rendered as a Next.js <Link>. */
export function ButtonLink({
  variant,
  size,
  className,
  iconLeft,
  iconRight,
  children,
  ...props
}: StyleProps & IconProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      <Content iconLeft={iconLeft} iconRight={iconRight}>
        {children}
      </Content>
    </Link>
  );
}
