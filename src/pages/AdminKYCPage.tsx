import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { KYCList } from "@/components/admin/KYCList";
import { DisputeList } from "@/components/admin/DisputeList";
import { MembershipList } from "@/components/admin/MembershipList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs"; // Ajusta según tu UI
import { Loader2 } from "lucide-react";

export function AdminKYCPage() {
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState<"kyc" | "disputes" | "memberships">("kyc");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Funciones de acción centralizadas
  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    setActionLoading(userId);
    // Aquí iría tu lógica de actualización de Firebase
    setActionLoading(null);
  };

  const handleResolveDispute = async (disputeId: string, tradeId: string, favor: "buyer" | "seller") => {
    setActionLoading(disputeId);
    // Aquí iría la lógica de resolución de disputas que revisamos
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración</h1>

      <Tabs defaultValue="kyc" onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="kyc">KYC ({pendingUsers.length})</TabsTrigger>
          <TabsTrigger value="disputes">Disputas ({disputes.length})</TabsTrigger>
          <TabsTrigger value="memberships">Membresías ({payments.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {activeTab === "kyc" && (
          <KYCList users={pendingUsers} onAction={handleUserAction} loading={actionLoading} />
        )}
        
        {activeTab === "disputes" && (
          <DisputeList 
            disputes={disputes} 
            expandedId={null} // Puedes gestionar este estado aquí o dentro del componente
            setExpandedId={() => {}} 
            actionLoading={actionLoading} 
            onResolve={handleResolveDispute} 
          />
        )}

        {activeTab === "memberships" && (
          <MembershipList payments={payments} />
        )}
      </div>
    </div>
  );
}
