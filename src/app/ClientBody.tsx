"use client";

import { useEffect } from "react";
import TvRemoteNavigation from "@/components/tv/TvRemoteNavigation";

export default function ClientBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (className) {
      document.body.className = className;
    }
  }, [className]);

  return (
    <body suppressHydrationWarning className={className}>
      <TvRemoteNavigation />
      {children}
    </body>
  );
}
