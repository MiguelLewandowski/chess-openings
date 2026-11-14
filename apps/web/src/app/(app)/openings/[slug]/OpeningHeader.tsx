import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader, PageTitle } from "@/components/layout/Page";

export function OpeningHeader({
  backHref,
  backLabel,
  subtitle,
  children,
}: {
  backHref: string;
  backLabel: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <PageHeader>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-ink-500 hover:text-ink-900 hover:bg-surface-sunken transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <PageTitle subtitle={subtitle}>{children}</PageTitle>
      </div>
    </PageHeader>
  );
}
