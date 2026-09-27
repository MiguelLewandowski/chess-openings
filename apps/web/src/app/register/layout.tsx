import type { Metadata } from "next";

// The page is a client component (it holds the form state), so its title lives here.
export const metadata: Metadata = { title: "Criar conta" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
