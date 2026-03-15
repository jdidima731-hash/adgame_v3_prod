import DashboardLayout from "@/components/DashboardLayout";
import { BroadcastManager as BroadcastManagerComponent } from "@/components/BroadcastManager";

export default function BroadcastManagerPage() {
  return (
    <DashboardLayout>
    {/* dark mode supported */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📡 Gestion de la diffusion</h1>
        <BroadcastManagerComponent />
      </div>
    </DashboardLayout>
  );
}
