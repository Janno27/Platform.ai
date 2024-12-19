"use client";

import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ABInitiatorLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isInitiator = pathname.includes("/playground/initiator");

  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  );
}