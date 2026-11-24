import Image from "next/image";

type Props = {
  name: string;
  url: string | null;
  size?: number;
  className?: string;
};

/** Profile photo, or the first letter of the name on pine. */
export function Avatar({ name, url, size = 36, className = "rounded-action" }: Props) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center bg-pine font-semibold text-leaf ring-1 ring-leaf/30 ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
