import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white/80 backdrop-blur-xl shadow-[0_4px_24px_-1px_rgba(0,0,0,0.03),0_0_20px_-5px_rgba(15,52,60,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05),0_0_25px_-5px_rgba(139,92,246,0.05)] transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-5 sm:p-6 border-b border-black/[0.04]", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-light leading-none tracking-tight text-[#0c0d0f] font-display", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs font-light text-[#6b7280] font-body", className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6 pt-4 font-body", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center p-5 sm:p-6 pt-0 font-body", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
