"use client";

import * as React from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-gray-900 rounded-2xl w-full max-w-md p-6 border border-emerald-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children }) {
  return <div className="space-y-4">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="space-y-1">{children}</div>;
}

export function DialogTitle({ children }) {
  return (
    <h2 className="text-lg font-semibold text-white">{children}</h2>
  );
}
