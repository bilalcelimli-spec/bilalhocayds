import Link from "next/link";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  className,
  href,
  type = "button",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex max-w-full items-center justify-center rounded-2xl text-center font-semibold whitespace-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0b0f]";

  const variantStyles =
    variant === "primary"
      ? "bg-white text-black hover:bg-zinc-200 hover:text-black shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
      : variant === "secondary"
        ? "border border-zinc-500 bg-zinc-800 text-white hover:bg-zinc-700"
        : "border border-white/45 bg-transparent text-white hover:bg-white/14";

  const sizeStyles =
    size === "sm"
      ? "px-4 py-2 text-sm"
      : size === "lg"
        ? "px-6 py-3.5 text-base"
        : "px-5 py-3 text-sm";

  const styles = cn(baseStyles, variantStyles, sizeStyles, className);

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  );
}