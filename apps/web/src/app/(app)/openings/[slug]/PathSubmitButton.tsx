'use client'

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

// Saving the choice is a round trip to the API: disable the button meanwhile so a second
// click does not send it twice.
export function PathSubmitButton({ className, children }: { className?: string; children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(className, pending && "opacity-60 cursor-wait")}>
      {children}
    </button>
  );
}
