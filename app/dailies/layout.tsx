import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dailys",
  description: "Daily reflections, habits, tasks, and meeting notes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dailys",
  },
};

export default function DailiesLayout({ children }: LayoutProps<"/dailies">) {
  return children;
}
