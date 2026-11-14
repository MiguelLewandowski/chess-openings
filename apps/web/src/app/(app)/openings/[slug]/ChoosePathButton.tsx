'use client'

import { useTransition, type ReactNode } from "react";
import type { OpeningStyle } from "@chess-openings/domain";
import { chooseOpeningPath } from "@/app/actions/opening.actions";
import { cn } from "@/lib/cn";

// Saves the path, then loads the track with a full navigation. A soft one (redirect from the
// action, router.push or router.refresh) was not reliable with Next 16.2.1: the server sent
// the track, yet the browser kept the choice screen on display in about half of the runs of
// the e2e script. Choosing a path is rare, so the extra page load costs little.
export function ChoosePathButton({
  family,
  style,
  // Where to go after saving; null reloads the current URL, which then shows the track.
  goTo,
  className,
  children,
}: {
  family: string;
  style: OpeningStyle;
  goTo: string | null;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  const choose = () =>
    startTransition(async () => {
      await chooseOpeningPath(family, style);
      window.location.assign(goTo ?? window.location.href);
    });

  return (
    <button
      type="button"
      onClick={choose}
      disabled={pending}
      aria-busy={pending}
      className={cn(className, pending && "opacity-60 cursor-wait")}
    >
      {children}
    </button>
  );
}
