import { Suspense } from "react";
import { DevAdminPanel } from "@/components/dev-admin-panel";
import { AdminGuard } from "@/components/AdminGuard";
import { Loader2 } from "lucide-react";

export default function DevAdminPage() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Dev Admin Panel</h1>
          <Suspense fallback={<Loader2 className="animate-spin mx-auto" />}>
            <DevAdminPanel />
          </Suspense>
        </div>
      </div>
    </AdminGuard>
  );
}
