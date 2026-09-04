"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ path }: { path: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}${path}`);
        toast.success("Link copied");
      }}
    >
      <Copy className="h-4 w-4" /> Copy
    </Button>
  );
}
