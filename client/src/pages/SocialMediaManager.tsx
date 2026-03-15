import DashboardLayout from "@/components/DashboardLayout";
import { SocialMediaManager as SocialManagerComponent } from "@/components/SocialMediaManager";
import { useAuth } from "@/_core/hooks/useAuth";

export default function SocialMediaManagerPage() {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-6">🤖 Social Media Manager</h1>
        <SocialManagerComponent advertiserId={user?.id ?? 0} isActive={true} />
      </div>
    </DashboardLayout>
  );
}
