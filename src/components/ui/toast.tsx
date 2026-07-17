"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const colors = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  error: "bg-red-50 border-red-200 text-red-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

const iconColors = {
  success: "text-emerald-500",
  error: "text-red-500",
  info: "text-blue-500",
};

export function Toast({ type, message, onClose, duration = 4000 }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-md",
        colors[type],
        exiting ? "animate-toast-out" : "animate-toast-in"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", iconColors[type])} />
      <span className="flex-1">{message}</span>
      <button onClick={() => { setExiting(true); setTimeout(onClose, 300); }} className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

let addToastFn: ((type: "success" | "error" | "info", message: string) => void) | null = null;

export function addToast(type: "success" | "error" | "info", message: string) {
  addToastFn?.(type, message);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (type, message) => {
      const id = String(Date.now()) + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
    };
    return () => { addToastFn = null; };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} type={toast.type} message={toast.message} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
