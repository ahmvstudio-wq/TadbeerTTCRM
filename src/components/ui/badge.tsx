import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "teal" | "gold";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-brand-teal text-white",
    teal: "bg-brand-teal-light text-brand-teal",
    gold: "bg-brand-gold-light text-amber-700",
    secondary: "bg-white border border-border text-text-secondary",
    destructive: "bg-red-50 text-red-600 border border-red-200",
    outline: "text-text-secondary border border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
