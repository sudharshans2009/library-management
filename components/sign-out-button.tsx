"use client";

import { signOut } from "@/lib/auth/client";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      <LogOut className="w-4 h-4" />
    </Button>
  );
}
