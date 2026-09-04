import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-6">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground">This page doesn't exist or the organization is unavailable.</p>
      <Link href="/"><Button>Go Home</Button></Link>
    </main>
  );
}
