import { useId } from "react";
import { clsx } from "clsx";

type Tone = "onDark" | "onLight";

/**
 * AcuPark mark: the rounded triangle from the original A·P·C logo, now carrying a single
 * geometric parking "P".
 * onDark = lilac-white mark with a purple P (for purple backgrounds);
 * onLight = purple mark with a white P.
 */
export default function Logo({ size = 120, tone = "onDark", className }: { size?: number; tone?: Tone; className?: string }) {
  const gid = useId();
  const [top, bottom, p] = tone === "onDark" ? ["#ffffff", "#d9c8f2", "#4b2e83"] : ["#6a3fb0", "#3a1d6e", "#ffffff"];

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={clsx("select-none", className)} role="img" aria-label="AcuPark">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <path d="M51 19 Q60 3 69 19 L109 89 Q117 104 100 104 L20 104 Q3 104 11 89 Z" fill={`url(#${gid})`} />
      <path d="M48 92 V54 H62 A10.5 10.5 0 0 1 62 75 H48" fill="none" stroke={p} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + "AcuPark" wordmark, stacked (splash) or inline (headers). */
export function LogoLockup({
  layout = "stacked",
  tone = "onDark",
  tagline,
  className,
}: {
  layout?: "stacked" | "inline";
  tone?: Tone;
  tagline?: string;
  className?: string;
}) {
  const ink = tone === "onDark" ? "text-white" : "text-[#3a1d6e]";
  const sub = tone === "onDark" ? "text-white/65" : "text-[#6e6a78]";
  const stacked = layout === "stacked";

  return (
    <div className={clsx("flex items-center", stacked ? "flex-col text-center" : "flex-row gap-2.5", className)}>
      <Logo size={stacked ? 60 : 34} tone={tone} />
      <div className={clsx(stacked && "mt-3")}>
        <p className={clsx("leading-none tracking-tight", ink, stacked ? "text-[32px]" : "text-[22px]")}>
          <span className="font-medium">Acu</span>
          <span className="font-extrabold">Park</span>
        </p>
        {tagline && <p className={clsx("mt-2 text-[14px] tracking-wide", sub)}>{tagline}</p>}
      </div>
    </div>
  );
}
