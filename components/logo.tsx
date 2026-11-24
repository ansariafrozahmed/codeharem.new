import Image from "next/image";
import Link from "next/link";
import logo from "@/public/weblogo.webp";

export function Logo({ href = "/", height = 26 }: { href?: string; height?: number }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 rounded-action outline-offset-4 focus-visible:outline-2 focus-visible:outline-leaf"
    >
      <Image
        src={logo}
        alt="codeharem"
        priority
        style={{ height, width: "auto" }}
      />
    </Link>
  );
}
