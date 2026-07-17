import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  return (
    <div className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizes[size], className)}>
      {src ? (
        <img src={src} alt={name} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-brand-teal/10 text-brand-teal font-medium">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

export { Avatar };
