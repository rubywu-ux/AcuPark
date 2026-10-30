"use client";

import { clsx } from "clsx";
import { ChevronLeft, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, forwardRef, useCallback, useContext, useEffect, useState } from "react";
import type { LatLng, LotStatus } from "@/services/mockData";

// ---------- Buttons ----------

type ButtonVariant = "accent" | "brand" | "soft" | "outline" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  accent: "bg-accent text-accent-ink shadow-[0_6px_16px_rgba(255,199,0,0.35)] hover:brightness-95",
  brand: "bg-brand text-white shadow-[0_6px_16px_rgb(var(--brand)/0.3)] hover:brightness-110",
  soft: "bg-brand-soft text-brand-text hover:brightness-95",
  outline: "bg-card text-ink border border-line hover:bg-surface",
  ghost: "text-brand-text hover:bg-brand-soft",
  danger: "text-danger hover:bg-danger/10",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  href?: string;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "accent", size = "lg", href, block, className, children, ...rest },
  ref
) {
  const cls = clsx(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none",
    size === "lg" ? "h-14 px-6 text-[17px]" : "h-11 px-4 text-[15px]",
    block && "w-full",
    buttonStyles[variant],
    className
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} {...rest}>
      {children}
    </button>
  );
});

export function IconButton({
  className,
  label,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      className={clsx("grid place-items-center w-11 h-11 rounded-full transition active:scale-95", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------- Layout ----------

/** Purple header band from the Figma frames. */
export function TopBar({
  title,
  back,
  onBack,
  right,
  children,
  className,
}: {
  title?: React.ReactNode;
  back?: boolean | string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) return onBack();
    if (typeof back === "string") return router.push(back);
    router.back();
  };
  return (
    <header className={clsx("bg-band text-white px-4 pt-[max(env(safe-area-inset-top),14px)] pb-4", className)}>
      <div className="flex items-center gap-2 min-h-[44px]">
        {back && (
          <IconButton label="Back" onClick={handleBack} className="-ml-2 hover:bg-white/10">
            <ChevronLeft size={26} />
          </IconButton>
        )}
        <div className="flex-1 min-w-0 text-[17px] font-semibold truncate">{title}</div>
        {right}
      </div>
      {children}
    </header>
  );
}

/** Two-weight title: "Payment / Confirmation". */
export function TitleBlock({ strong, light, className }: { strong: string; light?: string; className?: string }) {
  return (
    <h1 className={clsx("text-[30px] leading-[1.1] tracking-tight", className)}>
      <span className="block font-bold">{strong}</span>
      {light && <span className="block font-light">{light}</span>}
    </h1>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("bg-card rounded-card border border-line shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx("text-[13px] font-semibold text-subtle", className)}>{children}</p>;
}

export function StatusPill({ status, open, total }: { status: LotStatus; open: number; total: number }) {
  const tone =
    status === "Full" ? "bg-danger/10 text-danger" : status === "Busy" ? "bg-warning/15 text-warning" : "bg-success/10 text-success";
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[13px] font-semibold whitespace-nowrap shrink-0", tone)}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {status === "Full" ? "Full" : `${open} of ${total} open`}
    </span>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "h-9 px-4 rounded-full text-[14px] font-medium whitespace-nowrap border transition",
        active ? "bg-brand text-white border-brand" : "bg-card text-ink border-line hover:border-brand/40",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx("flex p-1 rounded-xl bg-surface border border-line", className)} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 h-9 rounded-lg text-[14px] font-medium transition",
            value === o.value ? "bg-card text-ink shadow-card" : "text-muted"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Bottom sheet ----------

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-black/40 animate-[fade-up_0.2s_both]" onClick={onClose} />
      <div className="relative w-full max-w-app bg-card rounded-t-[28px] shadow-sheet animate-sheet-up pb-safe">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" />
        <div className="flex items-center justify-between px-6 pt-3">
          <h2 className="text-[20px] font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2 text-muted hover:bg-surface">
            <X size={22} />
          </IconButton>
        </div>
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  );
}

// ---------- Map thumbnail ----------

/** Real map tile behind a pin — the "Map" rectangle on Figma's lot cards. */
export function MapThumb({ at, className }: { at: LatLng; className?: string }) {
  const z = 16;
  const n = 2 ** z;
  const x = ((at[1] + 180) / 360) * n;
  const latRad = (at[0] * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  // 3×3 tiles drawn at 128px, shifted so the point lands in the centre of the thumb.
  const S = 128;
  return (
    <div className={clsx("relative overflow-hidden rounded-2xl border border-line bg-surface", className)}>
      <div
        className="leaflet-tile-pane absolute grid grid-cols-3"
        style={{
          width: S * 3,
          left: `calc(50% - ${(x - tx + 1) * S}px)`,
          top: `calc(50% - ${(y - ty + 1) * S}px)`,
        }}
      >
        {[-1, 0, 1].flatMap((dy) =>
          [-1, 0, 1].map((dx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${dx}${dy}`}
              alt=""
              width={S}
              height={S}
              src={`https://tile.openstreetmap.org/${z}/${tx + dx}/${ty + dy}.png`}
              className="block max-w-none"
            />
          ))
        )}
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="-mt-3 drop-shadow-md">
          <MapPin size={28} className="fill-brand text-white" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

// ---------- Toasts ----------

const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div className="fixed inset-x-0 top-[max(env(safe-area-inset-top),12px)] z-[90] flex justify-center px-4 pointer-events-none">
          <div
            role="status"
            className="max-w-app w-full rounded-2xl bg-ink text-bg px-4 py-3 text-[15px] font-medium shadow-lift animate-fade-up"
          >
            {msg}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function Spinner({ className }: { className?: string }) {
  return <span className={clsx("inline-block w-5 h-5 rounded-full border-2 border-current border-r-transparent animate-spin", className)} />;
}
