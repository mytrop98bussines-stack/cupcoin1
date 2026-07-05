import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { KYCList } from "../admin/KYCList";
import { DisputeList } from "../admin/DisputeList";
import { MembershipList } from "../admin/MembershipList";

export function AdminKYCPage() {
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState<"kyc" | "disputes" | "memberships">("kyc");

  if (loading) return <div>Cargando sistema administrativo...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Control Admin</h1>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("kyc")}>Usuarios KYC ({pendingUsers.length})</button>
        <button onClick={() => setActiveTab("disputes")}>Disputas ({disputes.length})</button>
        <button onClick={() => setActiveTab("memberships")}>Pagos Pendientes ({payments.length})</button>
      </div>

      {activeTab === "kyc" && <KYCList users={pendingUsers} />}
      {activeTab === "disputes" && <DisputeList disputes={disputes} />}
      {activeTab === "memberships" && <MembershipList payments={payments} />}
    </div>
  );
}
