"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "teal" | "gold";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-brand-teal text-white hover:bg-brand-teal-dark",
      teal: "bg-brand-teal text-white hover:bg-brand-teal-dark",
      gold: "bg-brand-gold text-brand-teal-dark hover:bg-brand-gold/90",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-border bg-transparent hover:bg-white text-text-primary",
      secondary: "bg-white border border-border text-text-primary hover:bg-cream-dark",
      ghost: "hover:bg-white text-text-secondary hover:text-text-primary",
    };
    const sizes = {
      default: "h-9 px-4 py-2 text-sm",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-6 text-sm",
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
