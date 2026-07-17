"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div ref={overlayRef} className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className={cn("relative bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border/50", className)}>
          {children}
        </div>
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between p-5 border-b border-border-light", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-text-primary", className)} {...props} />;
}

function DialogContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 p-5 border-t border-border-light", className)} {...props} />;
}

function DialogClose({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("absolute top-3.5 right-3.5 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-cream transition-colors", className)}>
      <X className="h-4 w-4" />
    </button>
  );
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose };
