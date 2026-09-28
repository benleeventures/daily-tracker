import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arc",
  description: "Bookmarks and resources",
};

export default function ArcLayout({ children }: { children: React.ReactNode }) {
  return children;
}
