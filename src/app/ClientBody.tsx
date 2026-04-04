"use client";

import { useEffect } from "react";
import Script from "next/script";
import TvRemoteNavigation from "@/components/tv/TvRemoteNavigation";

export default function ClientBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    if (className) {
      document.body.className = className;
    }
  }, [className]);

  return (
    <>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
      </head>
      <body suppressHydrationWarning className={className}>
        <TvRemoteNavigation />
        {children}
      </body>
    </>
  );
}
