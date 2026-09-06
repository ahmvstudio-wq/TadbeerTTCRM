"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "teal" | "gold";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-normal transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] font-body";
    const variants = {
      default: "bg-black text-white hover:bg-neutral-800 shadow-sm hover:shadow",
      teal: "bg-[#0f343c] text-white hover:bg-[#091f24] shadow-sm hover:shadow-[0_4px_16px_rgba(15,52,60,0.25)]",
      gold: "bg-[#c5a059] text-black hover:bg-[#b8934d] shadow-sm",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      outline: "border border-black/[0.08] bg-white/80 backdrop-blur-md hover:bg-white text-[#0c0d0f] shadow-2xs hover:border-black/[0.15]",
      secondary: "bg-[#f5f5f7] border border-black/[0.04] text-[#0c0d0f] hover:bg-[#ebebee]",
      ghost: "hover:bg-black/[0.03] text-[#6b7280] hover:text-black",
    };
    const sizes = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-10 rounded-xl px-5 text-sm",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
