"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function Render({
  children,
  path,
}: {
  children?: ReactNode;
  path?: string | null | undefined;
}) {
  const pathname = usePathname();

  return !pathname.startsWith(path || "/admin") ? <>{children}</> : null;
}
